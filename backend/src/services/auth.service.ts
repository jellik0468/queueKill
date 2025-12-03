import { User, Restaurant } from '@prisma/client';
import prisma from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { RegisterCustomerInput, RegisterOwnerInput, LoginInput } from '../validators/auth.validators';

// Response types
interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'CUSTOMER' | 'OWNER';
  };
  token: string;
}

interface OwnerAuthResponse extends AuthResponse {
  restaurant: {
    id: string;
    name: string;
    address: string;
  };
}

class AuthService {
  /**
   * Register a new customer
   */
  async registerCustomer(input: RegisterCustomerInput): Promise<AuthResponse> {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(input.password);

    // Create user with CUSTOMER role
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        phone: input.phone,
        role: 'CUSTOMER',
      },
    });

    // Generate token
    const token = signToken({
      userId: user.id,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Register a new owner with their restaurant
   */
  async registerOwner(input: RegisterOwnerInput): Promise<OwnerAuthResponse> {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(input.password);

    // Use transaction to create user and restaurant together
    const result = await prisma.$transaction(async (tx) => {
      // Create user with OWNER role
      const user = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          name: input.name,
          phone: input.phone,
          role: 'OWNER',
        },
      });

      // Create restaurant linked to owner
      const restaurant = await tx.restaurant.create({
        data: {
          name: input.restaurantName,
          address: input.restaurantAddress,
          ownerId: user.id,
        },
      });

      return { user, restaurant };
    });

    // Generate token
    const token = signToken({
      userId: result.user.id,
      role: result.user.role,
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
      restaurant: {
        id: result.restaurant.id,
        name: result.restaurant.name,
        address: result.restaurant.address,
      },
      token,
    };
  }

  /**
   * Login user
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Compare password
    const isValidPassword = await comparePassword(input.password, user.passwordHash);

    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT
    const token = signToken({
      userId: user.id,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Get current user by ID
   */
  async getCurrentUser(userId: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const authService = new AuthService();
