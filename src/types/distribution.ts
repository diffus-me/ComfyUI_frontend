export const isLocalhostDistribution = __DISTRIBUTION__ === 'localhost'
export const supportsMultipleUsers = !isLocalhostDistribution
