import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { PaymentProvider } from '@prisma/client';

/**
 * Payment Service
 * Manages payment configurations and payment processing
 */

// ==================== Payment Configuration ====================

export async function getAllPaymentConfigs() {
  try {
    return await prisma.paymentConfig.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  } catch (error) {
    logger.error('Get all payment configs error', { error });
    throw error;
  }
}

export async function getPaymentConfig(provider: PaymentProvider) {
  try {
    return await prisma.paymentConfig.findUnique({
      where: { provider },
    });
  } catch (error) {
    logger.error('Get payment config error', { error, provider });
    throw error;
  }
}

export async function getEnabledPaymentConfigs() {
  try {
    return await prisma.paymentConfig.findMany({
      where: { isEnabled: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        provider: true,
        name: true,
        isEnabled: true,
        isSandbox: true,
        sortOrder: true,
      },
    });
  } catch (error) {
    logger.error('Get enabled payment configs error', { error });
    throw error;
  }
}

export async function upsertPaymentConfig(data: {
  provider: PaymentProvider;
  name: string;
  isEnabled?: boolean;
  isSandbox?: boolean;
  // WeChat Pay
  wechatAppId?: string;
  wechatMchId?: string;
  wechatApiKey?: string;
  wechatCertPath?: string;
  // Alipay
  alipayAppId?: string;
  alipayPrivateKey?: string;
  alipayPublicKey?: string;
  // PayPal
  paypalClientId?: string;
  paypalSecret?: string;
  // Stripe
  stripePublicKey?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  // EPay
  epayUrl?: string;
  epayPid?: string;
  epayKey?: string;
  // Common
  notifyUrl?: string;
  returnUrl?: string;
  sortOrder?: number;
}) {
  try {
    const config = await prisma.paymentConfig.upsert({
      where: { provider: data.provider },
      update: {
        name: data.name,
        isEnabled: data.isEnabled,
        isSandbox: data.isSandbox,
        wechatAppId: data.wechatAppId,
        wechatMchId: data.wechatMchId,
        wechatApiKey: data.wechatApiKey,
        wechatCertPath: data.wechatCertPath,
        alipayAppId: data.alipayAppId,
        alipayPrivateKey: data.alipayPrivateKey,
        alipayPublicKey: data.alipayPublicKey,
        paypalClientId: data.paypalClientId,
        paypalSecret: data.paypalSecret,
        stripePublicKey: data.stripePublicKey,
        stripeSecretKey: data.stripeSecretKey,
        stripeWebhookSecret: data.stripeWebhookSecret,
        epayUrl: data.epayUrl,
        epayPid: data.epayPid,
        epayKey: data.epayKey,
        notifyUrl: data.notifyUrl,
        returnUrl: data.returnUrl,
        sortOrder: data.sortOrder,
      },
      create: {
        provider: data.provider,
        name: data.name,
        isEnabled: data.isEnabled ?? false,
        isSandbox: data.isSandbox ?? false,
        wechatAppId: data.wechatAppId,
        wechatMchId: data.wechatMchId,
        wechatApiKey: data.wechatApiKey,
        wechatCertPath: data.wechatCertPath,
        alipayAppId: data.alipayAppId,
        alipayPrivateKey: data.alipayPrivateKey,
        alipayPublicKey: data.alipayPublicKey,
        paypalClientId: data.paypalClientId,
        paypalSecret: data.paypalSecret,
        stripePublicKey: data.stripePublicKey,
        stripeSecretKey: data.stripeSecretKey,
        stripeWebhookSecret: data.stripeWebhookSecret,
        epayUrl: data.epayUrl,
        epayPid: data.epayPid,
        epayKey: data.epayKey,
        notifyUrl: data.notifyUrl,
        returnUrl: data.returnUrl,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    logger.info('Payment config upserted', { provider: data.provider });
    return config;
  } catch (error) {
    logger.error('Upsert payment config error', { error, provider: data.provider });
    throw error;
  }
}

export async function togglePaymentConfig(provider: PaymentProvider) {
  try {
    const config = await prisma.paymentConfig.findUnique({
      where: { provider },
    });

    if (!config) throw new Error('Payment config not found');

    const updated = await prisma.paymentConfig.update({
      where: { provider },
      data: { isEnabled: !config.isEnabled },
    });

    logger.info('Payment config toggled', { provider, isEnabled: updated.isEnabled });
    return updated;
  } catch (error) {
    logger.error('Toggle payment config error', { error, provider });
    throw error;
  }
}

export async function deletePaymentConfig(provider: PaymentProvider) {
  try {
    await prisma.paymentConfig.delete({
      where: { provider },
    });
    logger.info('Payment config deleted', { provider });
    return true;
  } catch (error) {
    logger.error('Delete payment config error', { error, provider });
    throw error;
  }
}

// ==================== Payment Provider Initialization ====================

const DEFAULT_PAYMENT_PROVIDERS = [
  { provider: 'WECHAT' as PaymentProvider, name: 'WeChat Pay' },
  { provider: 'ALIPAY' as PaymentProvider, name: 'Alipay' },
  { provider: 'PAYPAL' as PaymentProvider, name: 'PayPal' },
  { provider: 'STRIPE' as PaymentProvider, name: 'Stripe' },
  { provider: 'EPAY' as PaymentProvider, name: 'EPay' },
];

export async function initializePaymentConfigs() {
  try {
    for (const config of DEFAULT_PAYMENT_PROVIDERS) {
      const existing = await prisma.paymentConfig.findUnique({
        where: { provider: config.provider },
      });

      if (!existing) {
        await prisma.paymentConfig.create({
          data: {
            provider: config.provider,
            name: config.name,
            isEnabled: false,
            isSandbox: true,
          },
        });
      }
    }
    logger.info('Payment configs initialized');
  } catch (error) {
    logger.error('Initialize payment configs error', { error });
  }
}

// ==================== Payment Processing (Placeholder) ====================

export async function createPayment(data: {
  provider: PaymentProvider;
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  returnUrl?: string;
  notifyUrl?: string;
}) {
  try {
    const config = await getPaymentConfig(data.provider);
    if (!config || !config.isEnabled) {
      throw new Error('Payment provider not configured or disabled');
    }

    // Placeholder for actual payment gateway integration
    // This would be implemented based on specific payment provider SDKs
    logger.info('Payment created', { provider: data.provider, orderId: data.orderId });

    return {
      success: true,
      provider: data.provider,
      orderId: data.orderId,
      paymentUrl: null, // Would be returned by actual payment gateway
      transactionId: null,
    };
  } catch (error) {
    logger.error('Create payment error', { error, provider: data.provider });
    throw error;
  }
}

export async function verifyPayment(data: {
  provider: PaymentProvider;
  transactionId: string;
  signature?: string;
}) {
  try {
    const config = await getPaymentConfig(data.provider);
    if (!config) {
      throw new Error('Payment provider not configured');
    }

    // Placeholder for actual payment verification
    logger.info('Payment verified', { provider: data.provider, transactionId: data.transactionId });

    return {
      success: true,
      verified: false, // Would be verified by actual payment gateway
    };
  } catch (error) {
    logger.error('Verify payment error', { error, provider: data.provider });
    throw error;
  }
}

export default {
  getAllPaymentConfigs,
  getPaymentConfig,
  getEnabledPaymentConfigs,
  upsertPaymentConfig,
  togglePaymentConfig,
  deletePaymentConfig,
  initializePaymentConfigs,
  createPayment,
  verifyPayment,
};

