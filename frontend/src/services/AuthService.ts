import {
  register as registerApi,
  changePassword as changePasswordApi,
  verifyEmail as verifyEmailApi,
  forgotPassword as forgotPasswordApi,
  resetPassword as resetPasswordApi,
  resendVerificationEmail as resendVerificationEmailApi,
} from "@/api/authApi";
import {
  AuthResponse,
  ChangePasswordRequest,
  RegisterRequest,
  verifyEmailRequest,
} from "@/types/auth";
import { ResetPasswordRequest } from "../types/auth";

export const register = async ({
  first_name,
  last_name,
  email,
  password,
  phone_number,
  address,
}: RegisterRequest): Promise<AuthResponse> => {
  try {
    const response = await registerApi({
      first_name,
      last_name,
      email,
      password,
      phone_number,
      address,
    });
    return {
      success: true,
      message: response.data.message || "Registration successful",
    };
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data ||
      "An error occurred during registration";
    return {
      success: false,
      message,
    };
  }
};

export const changePassword = async ({
  userId,
  password,
  newPassword,
}: ChangePasswordRequest): Promise<AuthResponse> => {
  try {
    const response = await changePasswordApi({ userId, password, newPassword });
    return {
      success: true,
      message: response.data.message || "Password changed successfully",
    };
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data ||
      "An error occurred while changing the password";
    return {
      success: false,
      message,
    };
  }
};

export const verifyEmail = async ({
  email,
  verificationCode,
}: verifyEmailRequest): Promise<AuthResponse> => {
  try {
    const response = await verifyEmailApi({ email, verificationCode });
    return {
      success: true,
      message: response.data.message || "Email verified successfully",
    };
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data ||
      "An error occurred while verifying the email";
    return {
      success: false,
      message,
    };
  }
};

export const forgotPassword = async (email: string): Promise<AuthResponse> => {
  try {
    const response = await forgotPasswordApi(email);
    return {
      success: true,
      message: response.data.message || "Password reset email sent",
    };
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data ||
      "An error occurred while sending the password reset email";
    return {
      success: false,
      message,
    };
  }
};

export const resetPassword = async ({
  email,
  verificationCode,
  newPassword,
}: ResetPasswordRequest): Promise<AuthResponse> => {
  try {
    const response = await resetPasswordApi({
      email,
      verificationCode,
      newPassword,
    });
    return {
      success: true,
      message: response.data.message || "Password reset successfully",
    };
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data ||
      "An error occurred while resetting the password";
    return {
      success: false,
      message,
    };
  }
};

export const resendVerificationEmail = async (
  email: string
): Promise<AuthResponse> => {
  try {
    const response = await resendVerificationEmailApi(email);
    return {
      success: true,
      message:
        response.data.message || "Verification email resent successfully",
    };
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data ||
      "An error occurred while resending the verification email";
    return {
      success: false,
      message,
    };
  }
};
