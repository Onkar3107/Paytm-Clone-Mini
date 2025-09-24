"use server";

import db from "@repo/db/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { time } from "console";

export const sendMoney = async (recipient: string, amount: number) => {
  const session = await getServerSession(authOptions);

  if (!session) {
    return { error: "Unauthorized", status: 401 };
  }

  const senderIdRaw = session.user?.id;
  const senderId = Number(senderIdRaw);
  if (!Number.isFinite(senderId) || Number.isNaN(senderId)) {
    return { error: "Invalid sender id", status: 400 };
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Invalid amount", status: 400 };
  }

  const amountInCents = Math.round(amount * 100);
  if (amountInCents <= 0) {
    return { error: "Invalid amount after conversion", status: 400 };
  }

  const recipientUser = await db.user.findUnique({
    where: { number: recipient },
  });

  if (!recipientUser) {
    return { error: "Recipient not found", status: 404 };
  }

  if (recipientUser.id === senderId) {
    return { error: "Cannot transfer to self", status: 400 };
  }

  try {
    await db.$transaction(async (tx) => {
      // Determine lock order to avoid deadlocks (always lock lower id first)
      const [firstId, secondId] =
        senderId < recipientUser.id
          ? [senderId, recipientUser.id]
          : [recipientUser.id, senderId];

      await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${firstId} FOR UPDATE`;
      await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${secondId} FOR UPDATE`;

      const senderBalance = await tx.balance.findUnique({
        where: { userId: senderId },
      });

      if (!senderBalance) {
        throw new Error("Sender balance not found");
      }

      if (senderBalance.amount < amountInCents) {
        throw new Error("Insufficient funds");
      }

      await tx.balance.update({
        where: { userId: senderId },
        data: { amount: { decrement: amountInCents } },
      });

      await tx.balance.update({
        where: { userId: recipientUser.id },
        data: { amount: { increment: amountInCents } },
      });

      await tx.p2pTransfer.create({
        data: {
          amount: amountInCents,
          fromUserId: senderId,
          toUserId: recipientUser.id,
          timestamp: new Date(),
        },
      });
    });

    return { ok: true, status: 200 };
  } catch (err: any) {
    const msg = String(err?.message ?? "Transaction failed");
    if (msg.includes("Insufficient funds")) {
      return { error: msg, status: 402 };
    }
    if (msg.includes("Sender balance not found")) {
      return { error: msg, status: 400 };
    }

    console.error("sendMoney error:", err);
    return { error: "Transfer failed", status: 500 };
  }
};
