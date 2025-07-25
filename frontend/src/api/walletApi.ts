import { api } from "@/lib/axiosInstance";
import {
  DepositToWalletRequest,
  UseWalletByUserIdRequest,
} from "@/types/wallet";

export const getWalletByUserId = async (userId: string) => {
  try {
    const response = await api.get(`/wallet/${userId}`);
    if (response.status !== 200) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching wallet by user ID:", error);
    throw error;
  }
};

export const useWalletByUserId = async ({
  userId,
  amount,
  note,
}: UseWalletByUserIdRequest) => {
  try {
    const response = await api.post(`/wallet/use/${userId}`, {
      amount,
      note,
    });
    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching wallet by user ID:", error);
    throw error;
  }
};

export const depositToWallet = async ({
  method,
  userId,
  amount,
}: DepositToWalletRequest) => {
  try {
    const response = await api.post(`/wallet/deposit/${method}`, {
      user_id: userId,
      amount,
    });
    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }
    return response.data;
  } catch (error) {
    console.error("Error depositing to wallet:", error);
    throw error;
  }
};
