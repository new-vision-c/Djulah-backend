// swaggerSchemas.js  (root folder)

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         menuItem:
 *           type: string
 *           description: Menu item ID
 *         name:
 *           type: string
 *           example: Grilled Chicken
 *         quantity:
 *           type: number
 *           example: 2
 *         unitPrice:
 *           type: number
 *           example: 5000
 *         subtotal:
 *           type: number
 *           example: 10000
 *         ingredientCost:
 *           type: number
 *           example: 3500
 *
 *     Order:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         orderNumber:
 *           type: string
 *           example: ORD-20241123-0001
 *         restaurant:
 *           type: string
 *         orderType:
 *           type: string
 *           enum: [dine-in, takeaway]
 *           example: dine-in
 *         tableNumber:
 *           type: string
 *           example: "5"
 *           nullable: true
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         totalAmount:
 *           type: number
 *           example: 15000
 *         totalCost:
 *           type: number
 *           example: 5000
 *         totalProfit:
 *           type: number
 *           example: 10000
 *         orderStatus:
 *           type: string
 *           enum: [pending, served, completed]
 *           example: pending
 *         paymentStatus:
 *           type: string
 *           enum: [paid, unpaid]
 *           example: unpaid
 *         notes:
 *           type: string
 *           nullable: true
 *         createdBy:
 *           type: string
 *         servedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         completedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreateOrderInput:
 *       type: object
 *       required:
 *         - orderType
 *         - items
 *       properties:
 *         orderType:
 *           type: string
 *           enum: [dine-in, takeaway]
 *           example: dine-in
 *         tableNumber:
 *           type: string
 *           example: "5"
 *           description: Required for dine-in orders
 *         items:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: object
 *             required:
 *               - menuItem
 *               - quantity
 *             properties:
 *               menuItem:
 *                 type: string
 *                 description: Menu item ID
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *                 example: 2
 *           example:
 *             - menuItem: 507f1f77bcf86cd799439011
 *               quantity: 2
 *             - menuItem: 507f1f77bcf86cd799439012
 *               quantity: 1
 *         paymentStatus:
 *           type: string
 *           enum: [paid, unpaid]
 *           default: unpaid
 *         notes:
 *           type: string
 *           example: Extra spicy
 *
 *     SalesDashboardStats:
 *       type: object
 *       properties:
 *         grossRevenue:
 *           type: number
 *           example: 500000
 *         totalProfit:
 *           type: number
 *           example: 250000
 *         avgOrderValue:
 *           type: number
 *           example: 12500
 *         totalCustomersServed:
 *           type: number
 *           example: 40
 *         topSellingItems:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *               name:
 *                 type: string
 *                 example: Grilled Chicken
 *               totalQuantity:
 *                 type: number
 *                 example: 45
 *               totalRevenue:
 *                 type: number
 *                 example: 225000
 *         bestSellingCategory:
 *           type: object
 *           nullable: true
 *           properties:
 *             _id:
 *               type: string
 *               example: Lunch
 *             totalQuantity:
 *               type: number
 *               example: 120
 *             totalRevenue:
 *               type: number
 *               example: 350000
 */

// Reusable schemas
export const schemas = {};

// Full Ingredient object (response)
schemas.Ingredient = {
  type: 'object',
  properties: {
    _id: { type: 'string' },
    name: { type: 'string', example: 'Fresh Tomatoes' },
    category: { type: 'string', example: 'Vegetables' },
    currentQuantity: { type: 'number', example: 95.5 },
    averageCost: { type: 'number', example: 1100 },
    totalValue: { type: 'number', example: 104500 },
    isPerishable: { type: 'boolean', example: true },
    primaryUnit: { type: 'string', example: 'Kg' },
    minQuantity: { type: 'number', example: 20 },
    image: { type: 'string', nullable: true }
  }
};

// For creating/updating ingredient
schemas.IngredientInput = {
  type: 'object',
  required: ['name', 'category', 'primaryUnit'],
  properties: {
    name: { type: 'string' },
    category: { type: 'string' },
    variant: { type: 'string' },
    primaryUnit: { type: 'string' },
    minQuantity: { type: 'number' },
    isPerishable: { type: 'boolean' }
  }
};

schemas.StockTransaction = {
  type: 'object',
  properties: {
    _id: { type: 'string' },
    type: { type: 'string', enum: ['restock', 'usage', 'waste', 'adjustment'] },
    quantity: { type: 'number' },
    unitCost: { type: 'number' },
    totalCost: { type: 'number' },
    expiryDate: { type: 'string', format: 'date', nullable: true },
    note: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' }
  }
};

// Order Item (embedded in Order)
schemas.OrderItem = {
  type: 'object',
  properties: {
    _id: { type: 'string' },
    menuItem: { type: 'string', description: 'Menu item ID' },
    name: { type: 'string', example: 'Grilled Chicken' },
    quantity: { type: 'number', example: 2 },
    unitPrice: { type: 'number', example: 5000 },
    subtotal: { type: 'number', example: 10000 },
    ingredientCost: { type: 'number', example: 3500 }
  }
};

// Full Order/Sale object (response)
schemas.Order = {
  type: 'object',
  properties: {
    _id: { type: 'string' },
    orderNumber: { type: 'string', example: 'ORD-20241123-0001' },
    restaurant: { type: 'string' },
    orderType: { type: 'string', enum: ['dine-in', 'takeaway'], example: 'dine-in' },
    tableNumber: { type: 'string', example: '5', nullable: true },
    items: {
      type: 'array',
      items: { $ref: '#/components/schemas/OrderItem' }
    },
    totalAmount: { type: 'number', example: 15000 },
    totalCost: { type: 'number', example: 5000 },
    totalProfit: { type: 'number', example: 10000 },
    orderStatus: { type: 'string', enum: ['pending', 'served', 'completed'], example: 'pending' },
    paymentStatus: { type: 'string', enum: ['paid', 'unpaid'], example: 'unpaid' },
    notes: { type: 'string', nullable: true },
    createdBy: { type: 'string' },
    servedAt: { type: 'string', format: 'date-time', nullable: true },
    completedAt: { type: 'string', format: 'date-time', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

// For creating order
schemas.CreateOrderInput = {
  type: 'object',
  required: ['orderType', 'items'],
  properties: {
    orderType: {
      type: 'string',
      enum: ['dine-in', 'takeaway'],
      example: 'dine-in'
    },
    tableNumber: {
      type: 'string',
      example: '5',
      description: 'Required for dine-in orders'
    },
    items: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['menuItem', 'quantity'],
        properties: {
          menuItem: { type: 'string', description: 'Menu item ID' },
          quantity: { type: 'number', minimum: 1, example: 2 }
        }
      },
      example: [
        { menuItem: '507f1f77bcf86cd799439011', quantity: 2 },
        { menuItem: '507f1f77bcf86cd799439012', quantity: 1 }
      ]
    },
    paymentStatus: {
      type: 'string',
      enum: ['paid', 'unpaid'],
      default: 'unpaid'
    },
    notes: { type: 'string', example: 'Extra spicy' }
  }
};

// Sales Dashboard Stats
schemas.SalesDashboardStats = {
  type: 'object',
  properties: {
    grossRevenue: { type: 'number', example: 500000 },
    totalProfit: { type: 'number', example: 250000 },
    avgOrderValue: { type: 'number', example: 12500 },
    totalCustomersServed: { type: 'number', example: 40 },
    topSellingItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string', example: 'Grilled Chicken' },
          totalQuantity: { type: 'number', example: 45 },
          totalRevenue: { type: 'number', example: 225000 }
        }
      }
    },
    bestSellingCategory: {
      type: 'object',
      nullable: true,
      properties: {
        _id: { type: 'string', example: 'Lunch' },
        totalQuantity: { type: 'number', example: 120 },
        totalRevenue: { type: 'number', example: 350000 }
      }
    }
  }
};

// --- Auth Client Schemas ---

// Client User object (response)
schemas.ClientUser = {
  type: 'object',
  properties: {
    id: { type: 'string', example: '507f1f77bcf86cd799439011' },
    email: { type: 'string', format: 'email', example: 'client@djulah.cm' },
    name: { type: 'string', example: 'Alice N.' },
    isVerified: { type: 'boolean', example: true },
    accountStatus: { type: 'string', enum: ['active', 'suspended', 'deleted'], example: 'active' },
    createdAt: { type: 'string', format: 'date-time' }
  }
};

// Register input
schemas.RegisterInput = {
  type: 'object',
  required: ['email', 'password', 'name'],
  properties: {
    email: { type: 'string', format: 'email', example: 'client@djulah.cm' },
    password: { type: 'string', minLength: 6, example: 'password123' },
    name: { type: 'string', example: 'Alice N.' }
  }
};

// Login input
schemas.LoginInput = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: { type: 'string', format: 'email', example: 'client@djulah.cm' },
    password: { type: 'string', example: 'password123' }
  }
};

// Verify email input
schemas.VerifyEmailInput = {
  type: 'object',
  required: ['email', 'code'],
  properties: {
    email: { type: 'string', format: 'email', example: 'client@djulah.cm' },
    code: { type: 'string', example: '123456' }
  }
};

// Forgot password input
schemas.ForgotPasswordInput = {
  type: 'object',
  required: ['email'],
  properties: {
    email: { type: 'string', format: 'email', example: 'client@djulah.cm' }
  }
};

// Reset password input
schemas.ResetPasswordInput = {
  type: 'object',
  required: ['email', 'code', 'password', 'confirmPassword'],
  properties: {
    email: { type: 'string', format: 'email', example: 'client@djulah.cm' },
    code: { type: 'string', example: '123456' },
    password: { type: 'string', minLength: 6, example: 'newPassword123' },
    confirmPassword: { type: 'string', example: 'newPassword123' }
  }
};

// Change password input
schemas.ChangePasswordInput = {
  type: 'object',
  required: ['currentPassword', 'newPassword', 'confirmNewPassword'],
  properties: {
    currentPassword: { type: 'string', example: 'oldPassword123' },
    newPassword: { type: 'string', minLength: 6, example: 'newPassword123' },
    confirmNewPassword: { type: 'string', example: 'newPassword123' }
  }
};