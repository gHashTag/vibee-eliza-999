/**
 * Environment validator for checking required environment variables
 */
/**
 * Validates required environment variables
 */
export const envValidator = {
    validate() {
        const missingCritical = [];
        const errors = [];
        // Проверяем критичные переменные
        const criticalVars = [
            'TELEGRAM_BOT_TOKEN',
            'OPENROUTER_API_KEY',
            'INFISICAL_CLIENT_ID',
            'INFISICAL_CLIENT_SECRET',
            'INFISICAL_PROJECT_ID',
            'INFISICAL_ENVIRONMENT',
        ];
        for (const varName of criticalVars) {
            if (!process.env[varName]) {
                missingCritical.push(varName);
            }
        }
        return {
            missingCritical,
            errors,
        };
    },
};
