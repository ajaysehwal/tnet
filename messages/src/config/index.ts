import "dotenv/config";

class Config {
  private static requiredEnvVars = [
    "PORT",
    "REDIS_HOST",
    "REDIS_PORT",
    "REDIS_PASSWORD",
    "NODE_ENV",
    "ENCRYPTION_KEY",
    "APPWRITE_KEY",
    "APPWRITE_PROJECT",
    "APPWRITE_DATABASE",
    "APPWRITE_COLLECTION_ID"
  ];

  static validateEnv() {
    const missingVars = this.requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );
    if (missingVars.length) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(", ")}`
      );
    }
  }

  static getBaseConfig() {
    return {
      port: parseInt(this.getEnvVariable("PORT"), 10),
      secretKey: this.getEnvVariable("ENCRYPTION_KEY"),
      redis: {
        host: this.getEnvVariable("REDIS_HOST"),
        port: parseInt(this.getEnvVariable("REDIS_PORT"), 10),
        password: this.getEnvVariable("REDIS_PASSWORD"),
        username: this.getEnvVariable("REDIS_USERNAME"),
      },
      appwrite:{
         key:this.getEnvVariable("APPWRITE_KEY"),
         project:this.getEnvVariable("APPWRITE_PROJECT"),
         database:this.getEnvVariable("APPWRITE_DATABASE"),
         collectionId:this.getEnvVariable("APPWRITE_COLLECTION_ID")
      },
      node_env: this.getEnvVariable("NODE_ENV"),
    };
  }
  static getEnvVariable(key: string, defaultValue?: string): string {
    const value = process.env[key];
    if (!value && defaultValue === undefined) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value || defaultValue!;
  }
}

Config.validateEnv();
export const config = Config.getBaseConfig();
