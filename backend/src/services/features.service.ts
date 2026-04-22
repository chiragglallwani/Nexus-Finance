import logger from "../config/logger";
import { Op } from "sequelize";
import { ApiResponseStatus, type ServiceResponse } from "../constants/apiResponse";
import IndividualTransactions, {
     type TransactionType,
} from "../database/models/IndividualTransactions";
import TenantBalance from "../database/models/TenantBalance";

export interface IndividualSafeToSpendData {
     safeToSpend: number;
     latestBalance: number;
     recurringOutflowsTotal: number;
     efficiencyPercentage: number;
}

export interface IndividualGhostTransactionsData {
     ghostTransactions: Array<{
          date: Date;
          amount: number;
          category: string;
          merchant_name: string;
          transaction_type: TransactionType | null;
     }>;
     subscriptionAudits: Array<{
          date: Date;
          amount: number;
          category: string;
          merchant_name: string;
          prev_amount: number;
          price_creep_pct: number;
          transaction_type: TransactionType | null;
     }>;
}

export interface IndividualOpportunityCostEngineData {
     riskLevelPct: number;
     years: number;
     totalPresentValue: number;
     totalFutureValueAtYears: number;
     yearlyTotals: Array<{
          year: number;
          totalFutureValue: number;
     }>;
     transactions: Array<{
          date: Date;
          merchant_name: string;
          category: string;
          amount: number;
          yearly_values: Array<{
               year: number;
               future_value: number;
          }>;
          tooltip: string;
     }>;
}

interface CategoryStats {
     category: "Passive Income" | "Investment" | "Healthcare" | "Travel" | "Shopping";
     currentUserTotal: number;
     peerAverageTotal: number;
     percentile: number;
}

export interface IndividualPeerBencmarkingData {
     salaryBand: {
          currentMonthlySalary: number;
          lowerBound: number;
          upperBound: number;
     };
     peerCount: number;
     categoryStats: Array<CategoryStats>;
}

class FeaturesService {
     /**
      * Individual “safe to spend”: latest tenant balance minus recurring outflows
      * (simplified until payday-based scheduling exists in the schema).
      */
     async individualSafeToSpend(
          tenantType: "INDIVIDUAL" | "BUSINESS",
     ): Promise<ServiceResponse<IndividualSafeToSpendData>> {
          if (tenantType !== "INDIVIDUAL") {
               return {
                    status: ApiResponseStatus.FORBIDDEN,
                    message: "Safe to spend is only available for individual accounts",
               };
          }

          try {
               const latest = await TenantBalance.findOne({
                    order: [["balance_date", "DESC"]],
                    attributes: ["balance"],
               });

               if (!latest) {
                    return {
                         status: ApiResponseStatus.NOT_FOUND,
                         message: "No balance record found for this tenant",
                    };
               }

               const latestBalance = Number(latest.balance);

               const recurringRows = await IndividualTransactions.findAll({
                    where: {
                         is_recurring: true,
                         transaction_type: "OUTFLOW",
                    },
                    attributes: ["amount"],
               });

               const recurringOutflowsTotal = recurringRows.reduce((sum, row) => {
                    return sum + Math.abs(Number(row.amount));
               }, 0);

               const safeToSpend = Math.max(0, latestBalance - recurringOutflowsTotal);

               const efficiencyPercentage = (safeToSpend / latestBalance) * 100;

               return {
                    status: ApiResponseStatus.SUCCESS,
                    message: "Safe to spend calculated successfully",
                    data: {
                         safeToSpend,
                         latestBalance,
                         recurringOutflowsTotal,
                         efficiencyPercentage,
                    },
               };
          } catch (error) {
               logger.error("individualSafeToSpend failed", {
                    error: error instanceof Error ? error.message : error,
               });
               return {
                    status: ApiResponseStatus.FAILURE,
                    message: "Failed to compute safe to spend",
                    error: error instanceof Error ? error.message : "Internal server error",
               };
          }
     }

     async individualGhostTransactions(
          tenantType: "INDIVIDUAL" | "BUSINESS",
     ): Promise<ServiceResponse<IndividualGhostTransactionsData>> {
          if (tenantType !== "INDIVIDUAL") {
               return {
                    status: ApiResponseStatus.FORBIDDEN,
                    message: "Ghost transactions are only available for individual accounts",
               };
          }

          try {
               const excludedCategories = ["salary", "passive income", "investment", "healthcare"];

               const candidateGhostTransactions = await IndividualTransactions.findAll({
                    where: {
                         transaction_type: "OUTFLOW",
                         category: {
                              [Op.notIn]: excludedCategories,
                         },
                    },
                    attributes: ["date", "amount", "category", "merchant_name", "transaction_type"],
                    order: [["date", "DESC"]],
               });

               // Ghost transactions: repeated (count > 1) in the same month for same merchant+category.
               const grouped = new Map<string, typeof candidateGhostTransactions>();
               for (const tx of candidateGhostTransactions) {
                    const d = new Date(tx.date);
                    const yyyy = d.getUTCFullYear();
                    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
                    const key = `${yyyy}-${mm}::${(tx.merchant_name || "").toLowerCase()}::${(tx.category || "").toLowerCase()}`;
                    const arr = grouped.get(key) || [];
                    arr.push(tx);
                    grouped.set(key, arr);
               }

               const ghostTransactions = Array.from(grouped.values())
                    .filter((rows) => rows.length > 1)
                    .flat()
                    .map((tx) => ({
                         date: tx.date,
                         amount: Number(tx.amount),
                         category: tx.category || "",
                         merchant_name: tx.merchant_name,
                         transaction_type: tx.transaction_type,
                    }));

               const subscriptionAudits = await IndividualTransactions.findAll({
                    where: {
                         transaction_type: "OUTFLOW",
                         prev_amount: { [Op.not]: null },
                         price_creep_pct: { [Op.not]: null },
                         [Op.and]: excludedCategories.map((c) => ({
                              category: { [Op.notILike]: c },
                         })),
                    },
                    attributes: [
                         "date",
                         "amount",
                         "category",
                         "merchant_name",
                         "transaction_type",
                         "prev_amount",
                         "price_creep_pct",
                    ],
               });

               return {
                    status: ApiResponseStatus.SUCCESS,
                    message: "Ghost transactions fetched successfully",
                    data: {
                         ghostTransactions,
                         subscriptionAudits: subscriptionAudits
                              .filter((tx) => {
                                   const normalizedCategory = (tx.category || "")
                                        .trim()
                                        .toLowerCase();
                                   return !excludedCategories.includes(normalizedCategory);
                              })
                              .map((tx) => ({
                                   date: tx.date,
                                   amount: Number(tx.amount),
                                   category: tx.category || "",
                                   merchant_name: tx.merchant_name,
                                   prev_amount: Number(tx.prev_amount || 0),
                                   price_creep_pct: Number(tx.price_creep_pct || 0),
                                   transaction_type: tx.transaction_type,
                              })),
                    },
               };
          } catch (error) {
               logger.error("individualGhostTransactions failed", {
                    error: error instanceof Error ? error.message : error,
               });
               return {
                    status: ApiResponseStatus.FAILURE,
                    message: "Failed to compute ghost transactions",
                    error: error instanceof Error ? error.message : "Internal server error",
               };
          }
     }

     async individualOpportunityCostEngine(
          tenantType: "INDIVIDUAL" | "BUSINESS",
          riskLeveLPct: number,
          years: number,
     ): Promise<ServiceResponse<IndividualOpportunityCostEngineData>> {
          if (tenantType !== "INDIVIDUAL") {
               return {
                    status: ApiResponseStatus.FORBIDDEN,
                    message: "Opportunity cost engine is only available for individual accounts",
               };
          }

          try {
               if (!Number.isFinite(riskLeveLPct) || riskLeveLPct < 0) {
                    return {
                         status: ApiResponseStatus.BAD_REQUEST,
                         message: "riskLeveLPct must be a non-negative number",
                    };
               }

               const n = Number.isFinite(years) ? Math.floor(years) : 0;
               if (n <= 0) {
                    return {
                         status: ApiResponseStatus.BAD_REQUEST,
                         message: "years must be a positive integer",
                    };
               }

               const wants = await IndividualTransactions.findAll({
                    where: {
                         transaction_type: "OUTFLOW",
                         category: {
                              [Op.in]: ["Entertainment", "Dining"],
                         },
                    },
                    attributes: ["date", "amount", "category", "merchant_name"],
                    order: [["date", "DESC"]],
               });

               const r = riskLeveLPct / 100;

               const transactions = wants.map((tx) => {
                    const pv = Math.abs(Number(tx.amount));
                    const yearlyValues = Array.from({ length: n }, (_, i) => {
                         const year = i + 1;
                         const fv = Number((pv * Math.pow(1 + r, year)).toFixed(2));
                         return { year, future_value: fv };
                    });
                    const finalFv = yearlyValues[yearlyValues.length - 1]?.future_value ?? pv;
                    return {
                         date: tx.date,
                         merchant_name: tx.merchant_name,
                         category: tx.category || "",
                         amount: pv,
                         yearly_values: yearlyValues,
                         tooltip: `Cost over time: ${pv.toFixed(2)} -> ${finalFv.toFixed(2)} in ${n} years @ ${riskLeveLPct}%`,
                    };
               });

               const totalPresentValue = Number(
                    transactions.reduce((sum, tx) => sum + tx.amount, 0).toFixed(2),
               );

               const yearlyTotals = Array.from({ length: n }, (_, i) => {
                    const year = i + 1;
                    const totalFutureValue = Number(
                         transactions
                              .reduce(
                                   (sum, tx) =>
                                        sum + (tx.yearly_values[i]?.future_value ?? tx.amount),
                                   0,
                              )
                              .toFixed(2),
                    );
                    return { year, totalFutureValue };
               });

               const totalFutureValueAtYears =
                    yearlyTotals[yearlyTotals.length - 1]?.totalFutureValue ?? totalPresentValue;

               return {
                    status: ApiResponseStatus.SUCCESS,
                    message: "Opportunity cost engine computed successfully",
                    data: {
                         riskLevelPct: riskLeveLPct,
                         years: n,
                         totalPresentValue,
                         totalFutureValueAtYears,
                         yearlyTotals,
                         transactions,
                    },
               };
          } catch (error) {
               logger.error("individualOpportunityCostEngine failed", {
                    error: error instanceof Error ? error.message : error,
               });
               return {
                    status: ApiResponseStatus.FAILURE,
                    message: "Failed to compute opportunity cost engine",
                    error: error instanceof Error ? error.message : "Internal server error",
               };
          }
     }

     async individualPeerBencmarking(
          tenantType: "INDIVIDUAL" | "BUSINESS",
          currentTenantId: string,
     ): Promise<ServiceResponse<IndividualPeerBencmarkingData>> {
          if (tenantType !== "INDIVIDUAL") {
               return {
                    status: ApiResponseStatus.FORBIDDEN,
                    message: "Peer benchmarking is only available for individual accounts",
               };
          }

          try {
               const now = new Date();
               const threeMonthsAgo = new Date(
                    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, 1, 0, 0, 0, 0),
               );

               // 1. Fetch Salary Data to find "Peers"
               const salaryRows = await IndividualTransactions.findAll({
                    where: {
                         category: { [Op.iLike]: "salary" },
                         transaction_type: "INFLOW",
                         date: { [Op.gte]: threeMonthsAgo },
                    },
                    attributes: ["tenant_id", "date", "amount"],
                    hooks: false,
               });

               const salaryByTenantByMonth = new Map<string, Map<string, number>>();
               for (const tx of salaryRows) {
                    const t = tx.tenant_id;
                    if (!t) continue;
                    const d = new Date(tx.date);
                    const monthKey = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;

                    const perMonth = salaryByTenantByMonth.get(t) || new Map<string, number>();
                    perMonth.set(
                         monthKey,
                         (perMonth.get(monthKey) || 0) + Math.abs(Number(tx.amount)),
                    );
                    salaryByTenantByMonth.set(t, perMonth);
               }

               const avgSalaryByTenant = new Map<string, number>();
               for (const [tenantId, monthMap] of salaryByTenantByMonth.entries()) {
                    const monthTotals = Array.from(monthMap.values());
                    const avg = monthTotals.reduce((s, v) => s + v, 0) / monthTotals.length;
                    avgSalaryByTenant.set(tenantId, avg);
               }

               const currentMonthlySalary = avgSalaryByTenant.get(currentTenantId);
               if (!currentMonthlySalary || currentMonthlySalary <= 0) {
                    return {
                         status: ApiResponseStatus.NOT_FOUND,
                         message: "Unable to determine current user's monthly salary for benchmarking",
                    };
               }

               // Define Salary Band (+/- 20%)
               const lowerBound = currentMonthlySalary * 0.8;
               const upperBound = currentMonthlySalary * 1.2;

               const peerTenantIds = Array.from(avgSalaryByTenant.entries())
                    .filter(([tenantId, avg]) => {
                         if (tenantId === currentTenantId) return false;
                         return avg >= lowerBound && avg <= upperBound;
                    })
                    .map(([tenantId]) => tenantId);

               // 2. Fetch Aggregated Data for Benchmarking Categories
               const benchmarkCategories = [
                    "Passive Income",
                    "Investment",
                    "Healthcare",
                    "Travel",
                    "Shopping",
               ];

               const poolTenantIds = [currentTenantId, ...peerTenantIds];
               const allRelevantTxs = await IndividualTransactions.findAll({
                    where: {
                         tenant_id: { [Op.in]: poolTenantIds },
                         date: { [Op.gte]: threeMonthsAgo },
                         [Op.or]: [
                              { category: { [Op.iLike]: { [Op.any]: benchmarkCategories } } },
                              { transaction_type: "OUTFLOW" }, // To calculate total outflow standing
                         ],
                    },
                    attributes: ["tenant_id", "category", "amount", "transaction_type"],
                    hooks: false,
               });

               // Initialize Totals Map
               const totalsByTenant = new Map<string, Record<string, number>>();
               for (const id of poolTenantIds) {
                    const init: Record<string, number> = { totalOutflow: 0 };
                    benchmarkCategories.forEach((cat) => (init[cat.toLowerCase()] = 0));
                    totalsByTenant.set(id, init);
               }

               // Fill Totals
               for (const tx of allRelevantTxs) {
                    const t = tx.tenant_id;
                    const tenantData = totalsByTenant.get(t!);
                    if (!tenantData) continue;

                    const amount = Math.abs(Number(tx.amount));
                    const cat = (tx.category || "").toLowerCase();

                    // Add to specific benchmark category if it matches
                    benchmarkCategories.forEach((bCat) => {
                         if (cat === bCat.toLowerCase()) {
                              tenantData[cat] = (tenantData[cat] || 0) + amount;
                         }
                    });

                    // Add to total outflow if it's a debit
                    if (tx.transaction_type === "OUTFLOW") {
                         tenantData.totalOutflow = (tenantData.totalOutflow || 0) + amount;
                    }
               }

               // 3. Compute Stats and Percentiles
               const currentTenantData = totalsByTenant.get(currentTenantId)!;

               const categories = [
                    ...benchmarkCategories.map((c) => ({ original: c, key: c.toLowerCase() })),
                    { original: "Total Outflow", key: "totalOutflow" },
               ].map(({ original, key }) => {
                    const currentUserValue = currentTenantData[key] || 0;
                    const peerValues = peerTenantIds.map(
                         (id) => totalsByTenant.get(id)?.[key] || 0,
                    );

                    const peerAverageTotal =
                         peerValues.length > 0
                              ? peerValues.reduce((a, b) => a + b, 0) / peerValues.length
                              : 0;

                    /**
                     * Percentile Calculation Logic:
                     * For Passive Income: More is better (Percentile = % peers you earn MORE than)
                     * For Others (Spending/Invest): Less is better (Percentile = % peers you spend LESS than)
                     */
                    const higherIsBetter = original === "Passive Income";
                    const betterThanCount = peerValues.filter((val) =>
                         higherIsBetter ? currentUserValue > val : currentUserValue < val,
                    ).length;

                    const percentile =
                         peerValues.length > 0 ? (betterThanCount / peerValues.length) * 100 : 100;

                    return {
                         category: original,
                         currentUserTotal: Number(currentUserValue.toFixed(2)),
                         peerAverageTotal: Number(peerAverageTotal.toFixed(2)),
                         percentile: Number(percentile.toFixed(2)),
                    };
               });

               return {
                    status: ApiResponseStatus.SUCCESS,
                    message: "Peer benchmarking computed successfully",
                    data: {
                         salaryBand: {
                              currentMonthlySalary: Number(currentMonthlySalary.toFixed(2)),
                              lowerBound: Number(lowerBound.toFixed(2)),
                              upperBound: Number(upperBound.toFixed(2)),
                         },
                         peerCount: peerTenantIds.length,
                         categoryStats: categories as CategoryStats[],
                    },
               };
          } catch (error) {
               logger.error("individualPeerBencmarking failed", { error, currentTenantId });
               return {
                    status: ApiResponseStatus.FAILURE,
                    message: "Failed to compute peer benchmarking",
                    error: error instanceof Error ? error.message : "Unknown error",
               };
          }
     }
}

export default new FeaturesService();
