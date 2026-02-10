// Calculate who owes whom based on expenses
export function calculateDebts(expenses, tripMembers) {
  if (!expenses || expenses.length === 0 || !tripMembers || tripMembers.length === 0) {
    return [];
  }

  // Calculate total spent by each person
  const spent = {};
  tripMembers.forEach((member) => {
    spent[member] = 0;
  });

  expenses.forEach((expense) => {
    if (!(expense.payer_name in spent)) {
      spent[expense.payer_name] = 0;
    }
    // Handle both 'amount' and 'amount_eur' field names
    const amount = expense.amount || expense.amount_eur || 0;
    spent[expense.payer_name] += amount;
  });

  // Calculate total and per-person share
  const totalSpent = Object.values(spent).reduce((a, b) => a + b, 0);
  const perPersonShare = totalSpent / tripMembers.length;

  // Calculate balance (positive = is owed money, negative = owes money)
  const balances = {};
  tripMembers.forEach((member) => {
    balances[member] = (spent[member] || 0) - perPersonShare;
  });

  // Settle debts using greedy algorithm
  const settlements = [];
  const debtors = Object.entries(balances)
    .filter(([, balance]) => balance < -0.01) // owes money
    .sort((a, b) => a[1] - b[1]); // most debt first
  const creditors = Object.entries(balances)
    .filter(([, balance]) => balance > 0.01) // is owed money
    .sort((a, b) => b[1] - a[1]); // most credit first

  let debtorIdx = 0;
  let creditorIdx = 0;

  while (debtorIdx < debtors.length && creditorIdx < creditors.length) {
    const [debtorName, debtAmount] = debtors[debtorIdx];
    const [creditorName, creditAmount] = creditors[creditorIdx];

    const amountToSettle = Math.min(Math.abs(debtAmount), creditAmount);

    settlements.push({
      from: debtorName,
      to: creditorName,
      amount: Math.round(amountToSettle * 100) / 100, // Round to 2 decimals
    });

    debtors[debtorIdx][1] += amountToSettle; // Reduce debt
    creditors[creditorIdx][1] -= amountToSettle; // Reduce credit

    if (Math.abs(debtors[debtorIdx][1]) < 0.01) debtorIdx++;
    if (creditors[creditorIdx][1] < 0.01) creditorIdx++;
  }

  return settlements;
}

// Format settlement for display
export function formatSettlement(settlement) {
  return `${settlement.from} owes ${settlement.to} €${settlement.amount.toFixed(2)}`;
}
