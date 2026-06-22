import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { Cliente } from './cliente.entity';

describe('ClientesService', () => {
  let service: ClientesService;
  let repo: {
    find: jest.Mock;
    findAndCount: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      find: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientesService,
        { provide: getRepositoryToken(Cliente), useValue: repo },
      ],
    }).compile();

    service = module.get<ClientesService>(ClientesService);
  });

  describe('listar', () => {
    it('lista apenas ativos sem busca', async () => {
      repo.find.mockResolvedValue([{ id: 1 }]);
      const r = await service.listar();
      expect(repo.find).toHaveBeenCalledWith({
        where: { ativo: true },
        order: { nome: 'ASC' },
      });
      expect(r).toEqual([{ id: 1 }]);
    });

    it('retorna paginado quando page e limit são informados', async () => {
      repo.findAndCount.mockResolvedValue([[{ id: 1 }], 1]);
      const r = await service.listar(undefined, 2, 10);
      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
      expect(r).toEqual({ data: [{ id: 1 }], total: 1, page: 2, limit: 10 });
    });
  });

  describe('buscar', () => {
    it('retorna o cliente quando existe', async () => {
      repo.findOne.mockResolvedValue({ id: 1, nome: 'Ana' });
      await expect(service.buscar(1)).resolves.toEqual({ id: 1, nome: 'Ana' });
    });

    it('lança NotFoundException quando não existe', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.buscar(99)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('criar', () => {
    it('cria e salva o cliente', async () => {
      const dto = { nome: 'Bia' } as any;
      repo.create.mockReturnValue(dto);
      repo.save.mockResolvedValue({ id: 5, ...dto });
      const r = await service.criar(dto);
      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(r).toEqual({ id: 5, nome: 'Bia' });
    });
  });

  describe('desativar', () => {
    it('marca como inativo quando o cliente existe', async () => {
      repo.findOne.mockResolvedValue({ id: 1 });
      repo.update.mockResolvedValue({});
      const r = await service.desativar(1);
      expect(repo.update).toHaveBeenCalledWith(1, { ativo: false });
      expect(r).toEqual({ mensagem: 'Cliente removido com sucesso' });
    });

    it('lança NotFoundException quando o cliente não existe', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.desativar(1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.update).not.toHaveBeenCalled();
    });
  });
});
