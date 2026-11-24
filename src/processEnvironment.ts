// Windows PowerShell must construct its own module paths when launched via Node.
// Inheriting PowerShell 7's PSModulePath can break legacy module autoloading.
export function windowsPowerShellEnvironment(environment:NodeJS.ProcessEnv=process.env):NodeJS.ProcessEnv {
 return Object.fromEntries(Object.entries(environment).filter(([key])=>key.toUpperCase()!=='PSMODULEPATH'));
}
