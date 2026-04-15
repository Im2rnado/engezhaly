/**
 * Returns an error message if the password does not meet policy, or null if valid.
 * Policy: min 8 chars, uppercase, lowercase, digit, symbol (non-alphanumeric).
 */
function getPasswordPolicyError(password) {
    if (password == null || typeof password !== 'string') {
        return 'Password is required';
    }
    if (password.length < 8) {
        return 'Password must be at least 8 characters';
    }
    if (!/[a-z]/.test(password)) {
        return 'Password must include a lowercase letter';
    }
    if (!/[A-Z]/.test(password)) {
        return 'Password must include an uppercase letter';
    }
    if (!/\d/.test(password)) {
        return 'Password must include a number';
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        return 'Password must include a symbol (e.g. !@#$%&)';
    }
    return null;
}

module.exports = { getPasswordPolicyError };
