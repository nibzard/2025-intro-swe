import React from "react";

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcfbfc]">
      <div className="w-full max-w-md px-6">
        <h2 className="text-lg font-medium text-black text-center mb-6">
          Budgetly
        </h2>

        {children}
      </div>
    </div>
  );
};

export default AuthLayout;