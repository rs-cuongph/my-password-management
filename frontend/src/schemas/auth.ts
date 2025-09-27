import * as v from 'valibot';

// Login schema
export const LoginSchema = v.object({
  email: v.pipe(
    v.string('Email là bắt buộc'),
    v.nonEmpty('Email không được để trống'),
    v.email('Email không hợp lệ')
  ),
  password: v.pipe(
    v.string('Mật khẩu là bắt buộc'),
    v.nonEmpty('Mật khẩu không được để trống'),
    v.minLength(6, 'Mật khẩu phải có ít nhất 6 ký tự')
  ),
});

// Register schema
export const RegisterSchema = v.object({
  email: v.pipe(
    v.string('Email là bắt buộc'),
    v.nonEmpty('Email không được để trống'),
    v.email('Email không hợp lệ')
  ),
  password: v.pipe(
    v.string('Mật khẩu là bắt buộc'),
    v.nonEmpty('Mật khẩu không được để trống'),
    v.minLength(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    v.regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số'
    )
  ),
  confirmPassword: v.string('Xác nhận mật khẩu là bắt buộc'),
});

// Password confirmation validation
export const RegisterWithConfirmSchema = v.pipe(
  RegisterSchema,
  v.forward(
    v.partialCheck(
      [['password'], ['confirmPassword']],
      (input) => input.password === input.confirmPassword,
      'Mật khẩu xác nhận không khớp'
    ),
    ['confirmPassword']
  )
);

// User profile schema
export const UserProfileSchema = v.object({
  email: v.pipe(
    v.string('Email là bắt buộc'),
    v.nonEmpty('Email không được để trống'),
    v.email('Email không hợp lệ')
  ),
  phone: v.optional(
    v.pipe(v.string(), v.regex(/^[0-9+\-\s()]+$/, 'Số điện thoại không hợp lệ'))
  ),
  avatar: v.optional(v.string()),
});

// Change password schema
export const ChangePasswordSchema = v.object({
  currentPassword: v.pipe(
    v.string('Mật khẩu hiện tại là bắt buộc'),
    v.nonEmpty('Mật khẩu hiện tại không được để trống')
  ),
  newPassword: v.pipe(
    v.string('Mật khẩu mới là bắt buộc'),
    v.nonEmpty('Mật khẩu mới không được để trống'),
    v.minLength(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
    v.regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số'
    )
  ),
  confirmNewPassword: v.string('Xác nhận mật khẩu mới là bắt buộc'),
});

export const ChangePasswordWithConfirmSchema = v.pipe(
  ChangePasswordSchema,
  v.forward(
    v.partialCheck(
      [['newPassword'], ['confirmNewPassword']],
      (input) => input.newPassword === input.confirmNewPassword,
      'Mật khẩu xác nhận không khớp'
    ),
    ['confirmNewPassword']
  )
);

// TOTP Setup schema
export const TOTPSetupSchema = v.object({
  tempToken: v.pipe(
    v.string('Token tạm thời là bắt buộc'),
    v.nonEmpty('Token tạm thời không được để trống')
  ),
});

// TOTP Verification schema
export const TOTPVerificationSchema = v.object({
  tempToken: v.pipe(
    v.string('Token tạm thời là bắt buộc'),
    v.nonEmpty('Token tạm thời không được để trống')
  ),
  totpCode: v.pipe(
    v.string('Mã TOTP là bắt buộc'),
    v.nonEmpty('Mã TOTP không được để trống'),
    v.length(6, 'Mã TOTP phải có đúng 6 chữ số'),
    v.regex(/^\d{6}$/, 'Mã TOTP chỉ được chứa số')
  ),
});

// Type exports
export type LoginInput = v.InferInput<typeof LoginSchema>;
export type RegisterInput = v.InferInput<typeof RegisterWithConfirmSchema>;
export type RegisterApiInput = v.InferInput<typeof RegisterSchema>; // API input without confirmPassword
export type UserProfileInput = v.InferInput<typeof UserProfileSchema>;
export type ChangePasswordInput = v.InferInput<
  typeof ChangePasswordWithConfirmSchema
>;
export type TOTPSetupInput = v.InferInput<typeof TOTPSetupSchema>;
export type TOTPVerificationInput = v.InferInput<typeof TOTPVerificationSchema>;
