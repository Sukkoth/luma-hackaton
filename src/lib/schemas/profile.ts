import * as v from "valibot";

export const UpdateProfileSchema = v.object({
  name: v.pipe(
    v.string("Display name is required"),
    v.trim(),
    v.nonEmpty("Display name cannot be empty"),
    v.minLength(2, "Name must be at least 2 characters"),
    v.maxLength(100, "Name must not exceed 100 characters")
  ),
});

export type UpdateProfileInput = v.InferOutput<typeof UpdateProfileSchema>;

export const ChangePasswordSchema = v.pipe(
  v.object({
    currentPassword: v.pipe(
      v.string("Current password is required"),
      v.nonEmpty("Current password is required")
    ),
    newPassword: v.pipe(
      v.string("New password is required"),
      v.minLength(8, "New password must be at least 8 characters long")
    ),
    confirmPassword: v.pipe(
      v.string("Password confirmation is required"),
      v.nonEmpty("Password confirmation is required")
    ),
  }),
  v.check(
    (input) => input.newPassword === input.confirmPassword,
    "New passwords do not match"
  )
);

export type ChangePasswordInput = v.InferOutput<typeof ChangePasswordSchema>;
