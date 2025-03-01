import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

const setEnv = (env: string | undefined) => {

    if (env == null) {
    
        return;
    }

    console.log(`[SET ENV] Set environment variables for ${env}...`);
  
    Object.entries({
        ...require(`./env/.env.${env}`)
    }).forEach(([key, value]) => {
        process.env[key] = value as string | undefined;
    });
}

setEnv(process.env.ENV);

export default nextConfig;
