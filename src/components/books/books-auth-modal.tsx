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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div className="ui-card relative w-full max-w-sm p-6 shadow-2xl">
        <div className="flex size-10 items-center justify-center rounded-[12px] border border-border bg-primary-muted text-primary">
          <Lock className="size-5" />
        </div>
        <h3
          id="books-auth-title"
          className="mt-3 text-[18px] font-medium text-foreground"
        >
          Sign In to Log Progress
        </h3>
        <p className="mt-1 text-[13px] leading-relaxed text-foreground-secondary">
          Marking chapters as read and saving your scripture coverage requires
          an account.
        </p>
        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={onSignIn}
            className="ui-btn-primary flex-1 gap-1.5"
          >
            <LogIn className="size-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ui-btn-secondary px-4"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
