## Calculate the vault filling logic

```
async function calculateFractionalVaults(tenantId) {
    const { balance } = await tenantBalance.findOne({ where: { tenant_id: tenantId } });
    const vaults = await Vault.findAll({
        where: { tenant_id: tenantId },
        order: [['priority', 'ASC']] // 1 is highest priority
    });

    const totalVaults = vaults.length;
    // Calculate sum of weights (e.g., for 5 vaults: 5+4+3+2+1 = 15)
    const totalWeight = (totalVaults * (totalVaults + 1)) / 2;

    const allocations = vaults.map((vault, index) => {
        // Vault at index 0 (Priority 1) gets weight 5
        // Vault at index 4 (Priority 5) gets weight 1
        const weight = totalVaults - index;
        const fractionalShare = weight / totalWeight;

        let assignedAmount = balance * fractionalShare;

        // Cap the amount so it doesn't exceed the vault's target
        const finalAmount = Math.min(assignedAmount, vault.target_amount);

        return {
            name: vault.name,
            priority: vault.priority,
            sharePercentage: (fractionalShare * 100).toFixed(2) + '%',
            currentAllocation: finalAmount.toFixed(2),
            target: vault.target_amount,
            status: finalAmount >= vault.target_amount ? 'Completed' : 'Saving'
        };
    });

    return allocations;
}
```
