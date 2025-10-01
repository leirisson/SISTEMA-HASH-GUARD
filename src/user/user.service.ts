import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingEmail = await this.findByEmail(createUserDto.email);
    if (existingEmail) {
      throw new BadRequestException('Email já está em uso');
    }

    const existingUsername = await this.findByUsername(createUserDto.username);
    if (existingUsername) {
      throw new BadRequestException('Username já está em uso');
    }

    return this.prisma.user.create({
      data: {
        ...createUserDto,
        role: createUserDto.role || Role.USER,
      },
    });
  }

  async findAll(currentUser: User): Promise<Omit<User, 'password'>[]> {
    // Apenas administradores podem listar usuários
    if (currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem listar usuários');
    }

    // Administradores podem ver todos os usuários
    const users = await this.prisma.user.findMany();
    
    // Remover campo password de todos os usuários
    return users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUser: User): Promise<User> {
    const targetUser = await this.findById(id);
    if (!targetUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar permissões baseadas em roles
    this.checkUpdatePermissions(currentUser, targetUser, updateUserDto);

    const updateData: any = { ...updateUserDto };

    // Hash da nova senha se fornecida
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 12);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    }) as Promise<User>;
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const targetUser = await this.findById(id);
    if (!targetUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar permissões para exclusão
    this.checkDeletePermissions(currentUser, targetUser);

    // Não permitir auto-exclusão
    if (currentUser.id === id) {
      throw new ForbiddenException('Não é possível excluir sua própria conta');
    }

    await this.prisma.user.delete({
      where: { id },
    });
  }

  private checkUpdatePermissions(currentUser: User, targetUser: User, updateDto: UpdateUserDto): void {
    // Usuários comuns só podem atualizar seus próprios dados (exceto role)
    if (currentUser.role === Role.USER) {
      if (currentUser.id !== targetUser.id) {
        throw new ForbiddenException('Você só pode atualizar seus próprios dados');
      }
      if (updateDto.role) {
        throw new ForbiddenException('Você não pode alterar seu próprio role');
      }
    }

    // Supervisores podem gerenciar apenas usuários comuns
    if (currentUser.role === Role.SUPER) {
      if (targetUser.role !== Role.USER) {
        throw new ForbiddenException('Supervisores só podem gerenciar usuários comuns');
      }
      if (updateDto.role && updateDto.role !== Role.USER) {
        throw new ForbiddenException('Supervisores só podem definir role como USER');
      }
    }

    // Administradores podem gerenciar supervisores e usuários comuns (não outros admins)
    if (currentUser.role === Role.ADMIN) {
      if (targetUser.role === Role.ADMIN && currentUser.id !== targetUser.id) {
        throw new ForbiddenException('Administradores não podem gerenciar outros administradores');
      }
    }
  }

  private checkDeletePermissions(currentUser: User, targetUser: User): void {
    // Usuários comuns não podem excluir ninguém
    if (currentUser.role === Role.USER) {
      throw new ForbiddenException('Usuários comuns não podem excluir contas');
    }

    // Supervisores só podem excluir usuários comuns
    if (currentUser.role === Role.SUPER) {
      if (targetUser.role !== Role.USER) {
        throw new ForbiddenException('Supervisores só podem excluir usuários comuns');
      }
    }

    // Administradores podem excluir supervisores e usuários comuns (não outros admins)
    if (currentUser.role === Role.ADMIN) {
      if (targetUser.role === Role.ADMIN) {
        throw new ForbiddenException('Administradores não podem excluir outros administradores');
      }
    }
  }
}