import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import Store from 'App/Models/Store'
import Product from 'App/Models/Product'
import {
  ProductValidator,
  ProductUpdateValidator,
} from 'App/Validators/Client/Product/ProductValidator'

export default class ProductsController {
  // Criar produto
  public async store({ request, response, auth }: HttpContextContract) {
    const { id } = auth.use('api').user!
    const trx = await Database.transaction()

    const data = await request.validate(ProductValidator)

    try {
      const store = await Store.findByOrFail('user_id', id)

      const slug =
        data.slug
          .toLowerCase()
          .replace(/ /g, '-')
          .replace(/[^\w-]+/g, '') +
        '-' +
        store.prefix

      const product = await Product.create(
        { ...data, storeId: store.id, userId: id, slug },
        { client: trx }
      )

      // Arquivos
      if (data.files && data.files.length > 0) {
        await product.related('files').attach(data.files, trx)
      }

      // Categorias
      if (data.categories && data.categories.length > 0) {
        await product.related('categories').attach(data.categories, trx)
      }

      // Variações
      if (data.variations && data.variations.length > 0) {
        await product.related('variations').createMany(data.variations, trx)
      }

      await trx.commit()
      return response.status(201).send({ message: 'Produto criado com sucesso!' })
    } catch (err) {
      console.log(err)
      await trx.rollback()
      return response.status(400).send({ message: 'Não foi possível criar o produto.' })
    }
  }
  // Listar produtos
  public async index({ response, request, auth }: HttpContextContract) {
    const { id } = auth.use('api').user!
    const page = request.input('page', 1)
    const limit = 5

    try {
      const products = await Product.query()
        .where('user_id', id)
        // .preload('files')
        .paginate(page, limit)

      return response.status(200).send(products)
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível exibir os produtos.' })
    }
  }
  // Listar um produto
  public async show({ response, params, auth }: HttpContextContract) {
    const { id } = auth.use('api').user!

    try {
      const product = await Product.findByOrFail('lqid', params.lqid)

      if (product.userId !== id) {
        return response.status(400).send({ message: 'Não foi possível exibir o produto.' })
      }

      return response.status(200).send(product)
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível exibir o produto.' })
    }
  }
  // Atualizar Produto
  public async update({ response, request, params, auth }: HttpContextContract) {
    const { id } = auth.use('api').user!
    const data = await request.validate(ProductUpdateValidator)

    const product = await Product.findByOrFail('lqid', params.lqid)

    if (product.userId !== id) {
      return response.status(400).send({ message: 'Não é possível atualizar!' })
    }

    try {
      // Adicionar arquivos
      if (data.files && data.files.length > 0) {
        await product.related('files').attach(data.files)
      }

      // Adicionar categorias
      if (data.categories && data.categories.length > 0) {
        await product.related('categories').attach(data.categories)
      }

      await product.merge(data).save()

      return response.status(200).send({ message: 'Produto atualizado com sucesso!' })
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível atualizar o produto.' })
    }
  }

  // Remove Arquivos
  public async removeAttach({ response, request, params, auth }: HttpContextContract) {
    const { id } = auth.use('api').user!
    const data = await request.validate(ProductUpdateValidator)

    const product = await Product.findByOrFail('lqid', params.lqid)

    if (product.userId !== id) {
      return response.status(400).send({ message: 'Não é possível atualizar!' })
    }

    try {
      // remover arquivos
      if (data.files && data.files.length > 0) {
        await product.related('files').detach(data.files)
      }

      // remover categorias
      if (data.categories && data.categories.length > 0) {
        await product.related('categories').detach(data.files)
      }

      await product.merge(data).save()

      return response.status(200).send({ message: 'Produto atualizado com sucesso!' })
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível atualizar o produto.' })
    }
  }
  // Deletar produto
  public async destroy({ response, auth, params }: HttpContextContract) {
    const { id } = auth.use('api').user!
    try {
      const product = await Product.findByOrFail('lqid', params.lqid)

      if (product.userId !== id) {
        return response.status(400).send({ message: 'Não é possível deletar!' })
      }

      await product.delete()

      return response.status(200).send({ message: 'Produto excluído!' })
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível excluir!' })
    }
  }
}
