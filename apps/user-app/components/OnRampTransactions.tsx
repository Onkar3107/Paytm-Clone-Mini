import { Card } from "@repo/ui/card";

export const OnRampTransactions = ({
  transactions,
}: {
  transactions: {
    time: Date;
    amount: number;
    // TODO : Make more specific type for status
    status: string;
    provider: string;
  }[];
}) => {
  if (!transactions.length) {
    return (
      <Card title="Recent Transactions">
        <div className="text-center pb-8 pt-8">No Recent transactions</div>
      </Card>
    );
  }
  return (
    <Card title="Recent Transactions">
      <div className="pt-2">
        {transactions.map((t, idx) => (
          <div className="flex justify-between items-center py-2" key={idx}>
            <div>
              <div className="text-sm">Received INR</div>
              <div className="text-slate-600 text-xs">
                {t.time.toDateString()}
              </div>
              <div
                className={`text-xs font-bold ${
                  t.status === "Success"
                    ? "text-green-600"
                    : t.status === "Failure"
                    ? "text-red-600"
                    : t.status === "Processing"
                    ? "text-yellow-600"
                    : "text-slate-500"
                }`}
              >
                {t.status}
              </div>
            </div>
            <div className="flex flex-col justify-center">
              + Rs {t.amount / 100}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
