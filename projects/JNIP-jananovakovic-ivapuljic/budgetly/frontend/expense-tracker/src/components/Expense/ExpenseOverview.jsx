import React, { useEffect, useState } from "react";
import { LuPlus } from "react-icons/lu";
import CustomLineChart from "../Charts/CustomLineChart";
import { prepareExpenseLineChartData } from "../../utils/helper";

const ExpenseOverview = ({transactions, onExpenseIncome}) => {
  const data = [
    { month: "Jan", amount: 1200 },
    { month: "Feb", amount: 1500 },
    { month: "Mar", amount: 1800 },
    { month: "Apr", amount: 1100 },
    { month: "May", amount: 2000 },
    { month: "Jun", amount: 1700 },
    { month: "Jul", amount: 1900 },
    { month: "Aug", amount: 2100 },
    { month: "Sep", amount: 1600 },
    { month: "Oct", amount: 2300 },
    { month: "Nov", amount: 2500 },
    { month: "Dec", amount: 2700 },
  ];

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const result = prepareExpenseLineChartData(transactions);
    setChartData(result);

    return () => {};
  }, [transactions]);

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="">
          <h5 className="text-lg">Pregled potrošnje</h5>
        </div>

        <button className="add-btn" onClick={onExpenseIncome}>
          <LuPlus className="text-lg" />
          Dodaj potrošnju
        </button>
      </div>

      <div className="mt-10">
        <CustomLineChart data={chartData} />
      </div>
    </div>
  );
};

export default ExpenseOverview;
