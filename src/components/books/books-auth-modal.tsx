import { Lock, LogIn } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
};

export function BooksAuthModal({ isOpen, onClose, onSignIn }: Props) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="books-auth-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
    >
      <div className="glass-panel relative w-full max-w-sm rounded-[24px] border border-white/90 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#16161b]">
        <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#82ADD4]/20 text-[#507ea6] dark:bg-[#82ADD4]/30 dark:text-[#82ADD4]">
          <Lock className="h-5 w-5" />
        </div>
        <h3
          id="books-auth-title"
          className="mt-3 text-[18px] font-medium text-black dark:text-white"
        >
          Sign In to Log Progress
        </h3>
        <p className="mt-1 text-[13px] text-[#666666] dark:text-[#9CA3AF]">
          Marking chapters as read and saving your scripture coverage requires
          an account.
        </p>
        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={onSignIn}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[12px] bg-black py-2 text-[12px] font-medium text-white shadow-xs transition-colors hover:bg-black/85 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[12px] border border-black/10 bg-black/5 px-4 py-2 text-[12px] font-medium text-black hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
