"use server";

import db from "@repo/db/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";

export async function createOnRampTransaction(
  amount: number,
  provider: string
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return {
      message: "User not authenticated",
      status: 401,
    };
  }

  // Need to create a unique token(This will be ideally generated and returned by the on-ramp provider like Bank server) We are  simulating it here
  const token = Math.random().toString(36).substring(2);

//   console.log({
//     provider,
//     amount,
//     token,
//     userId,
//     status: "Processing",
//     startTime: new Date(),
//   });

    await db.onRampTransaction.create({
      data: {
        provider,
        amount: amount * 100, // Storing in cents
        token,
        userId: Number(userId),
        status: "Processing",
        startTime: new Date(),
      },
    });

  return {
    message: "Transaction created successfully",
    status: 200,
    token,
  };
}
