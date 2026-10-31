import * as v from "valibot";

export const LoginSchema = v.object({
  email: v.pipe(
    v.string("Email address is required"),
    v.trim(),
    v.nonEmpty("Email address is required"),
    v.email("Please enter a valid email address")
  ),
  password: v.pipe(
    v.string("Password is required"),
    v.nonEmpty("Password is required")
  ),
  rememberMe: v.optional(v.boolean(), false),
});

export type LoginInput = v.InferOutput<typeof LoginSchema>;

export const SignUpSchema = v.object({
  name: v.pipe(
    v.string("Full name is required"),
    v.trim(),
    v.nonEmpty("Full name is required"),
    v.minLength(2, "Full name must be at least 2 characters")
  ),
  email: v.pipe(
    v.string("Email address is required"),
    v.trim(),
    v.nonEmpty("Email address is required"),
    v.email("Please enter a valid email address")
  ),
  password: v.pipe(
    v.string("Password is required"),
    v.minLength(8, "Password must be at least 8 characters long")
  ),
  agreeTerms: v.pipe(
    v.boolean("You must agree to the Terms of Service"),
    v.check((val) => val === true, "You must agree to the Terms of Service")
  ),
});

export type SignUpInput = v.InferOutput<typeof SignUpSchema>;

export const ForgotPasswordSchema = v.object({
  email: v.pipe(
    v.string("Email address is required"),
    v.trim(),
    v.nonEmpty("Email address is required"),
    v.email("Please enter a valid email address")
  ),
});

export type ForgotPasswordInput = v.InferOutput<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = v.pipe(
  v.object({
    password: v.pipe(
      v.string("Password is required"),
      v.minLength(8, "Password must be at least 8 characters long")
    ),
    confirmPassword: v.pipe(
      v.string("Confirm password is required"),
      v.minLength(8, "Confirm password must be at least 8 characters long")
    ),
  }),
  v.check(
    (input) => input.password === input.confirmPassword,
    "Passwords do not match"
  )
);

export type ResetPasswordInput = v.InferOutput<typeof ResetPasswordSchema>;
