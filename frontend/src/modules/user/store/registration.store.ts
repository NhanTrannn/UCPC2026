import { create } from 'zustand';
import { getErrorMessage } from '../../../services/http';
import {
    submitTeamRegistration,
    type TeamRegistrationPayload,
    type TeamRegistrationResponse,
} from '../../../services/team-registration.service';

interface RegistrationState {
  isSubmitting: boolean;
  submitError: string | null;
  submitSuccess: string | null;
  submitTeam: (payload: TeamRegistrationPayload) => Promise<void>;
  clearSubmitError: () => void;
  clearSubmitSuccess: () => void;
}

export const useRegistrationStore = create<RegistrationState>((set) => ({
  isSubmitting: false,
  submitError: null,
  submitSuccess: null,
  submitTeam: async (payload) => {
    set({ isSubmitting: true, submitError: null, submitSuccess: null });

    try {
      const response: TeamRegistrationResponse = await submitTeamRegistration(payload);
      const successMessage =
        response?.EM ||
        response?.message ||
        'Đăng ký thành công.';
      set({ submitSuccess: successMessage });
    } catch (error) {
      const message = getErrorMessage(error);
      set({ submitError: message, submitSuccess: null });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },
  clearSubmitError: () => set({ submitError: null }),
  clearSubmitSuccess: () => set({ submitSuccess: null }),
}));
