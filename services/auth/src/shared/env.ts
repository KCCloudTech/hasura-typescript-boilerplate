export const DATA_URL = `${process.env.DATA_HOST}/v1/graphql`;
export const HASURA_GRAPHQL_ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET;
export const SESSION_KEY = process.env.SESSION_KEY;
export const SESSION_EXPIRY = process.env.SESSION_EXPIRY;
export const PASSWORD_SALT = process.env.PASSWORD_SALT ? parseInt(process.env.PASSWORD_SALT, 10) : 10;