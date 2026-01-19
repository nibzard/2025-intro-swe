import React from "react";
import CustomPieChart from "../charts/CustomPieChart";

const FinanceOverview = ({ totalBalance, totalIncome, totalExpense }) => {
  const COLORS = ["#875CF5", "#FA2C37", "#FF6900"];

  const balanceData = [
    { name: "Saldo", amount: totalBalance },
    { name: "Potrošnja", amount: totalExpense },
    { name: "Prihod", amount: totalIncome },
  ];

  return (
    <div className="card">
      <div className="flex items-center justify-between ">
        <h5 className="text-lg">Financijski pregled</h5>
      </div>

      <CustomPieChart
        data={balanceData}
        label="Saldo"
        totalAmount={`$${totalBalance}`}
        colors={COLORS}
        showTextAnchor
      />
    </div>
  );
};

export default FinanceOverview;
