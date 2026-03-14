import { create } from 'zustand';
import { getErrorMessage } from '../../../services/http';
import {
    submitTeamRegistration,
    type TeamRegistrationPayload,
} from '../../../services/team-registration.service';

interface RegistrationState {
  isSubmitting: boolean;
  submitError: string | null;
  submitTeam: (payload: TeamRegistrationPayload) => Promise<void>;
  clearSubmitError: () => void;
}

export const useRegistrationStore = create<RegistrationState>((set) => ({
  isSubmitting: false,
  submitError: null,
  submitTeam: async (payload) => {
    set({ isSubmitting: true, submitError: null });

    try {
      await submitTeamRegistration(payload);
    } catch (error) {
      const message = getErrorMessage(error);
      set({ submitError: message });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },
  clearSubmitError: () => set({ submitError: null }),
}));
