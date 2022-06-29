import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Category from 'App/Models/Category'
import Store from 'App/Models/Store'
import {
  CategoryValidator,
  CategoryUpdateValidator,
} from 'App/Validators/Client/Product/CategoryValidator'

export default class CategoriesController {
  // Criar categoria
  public async store({ request, response, auth }: HttpContextContract) {
    const { id } = auth.use('api').user!
    const data = await request.validate(CategoryValidator)

    try {
      const store = await Store.findByOrFail('user_id', id)

      if (store.userId !== id) {
        return response.status(400).send({ message: 'Não foi possível criar a categoria.' })
      }

      await Category.create({
        ...data,
        userId: id,
        storeId: store.id,
      })

      return response.status(201).send({ message: 'Categoria criada com sucesso!' })
    } catch (err) {
      console.log(err)
      return response.status(400).send({ message: 'Não foi possível criar a Categoria.' })
    }
  }
  // Listar Categorias
  public async index({ response, request, auth }: HttpContextContract) {
    const { id } = auth.use('api').user!
    const page = request.input('page', 1)
    const limit = 5

    try {
      const categories = await Category.query().where('user_id', id).paginate(page, limit)

      return response.status(200).send(categories)
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível exibir as categorias.' })
    }
  }
  // Listar uma categoria
  public async show({ response, params, auth }: HttpContextContract) {
    const { id } = auth.use('api').user!

    try {
      const category = await Category.findByOrFail('lqid', params.lqid)

      if (category.userId !== id) {
        return response.status(400).send({ message: 'Não foi possível exibir a categoria.' })
      }

      return response.status(200).send(category)
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível exibir a categoria.' })
    }
  }
  // Atualizar Categoria
  public async update({ response, request, params, auth }: HttpContextContract) {
    const { id } = auth.use('api').user!
    const data = await request.validate(CategoryUpdateValidator)

    const category = await Category.findByOrFail('lqid', params.lqid)

    if (category.userId !== id) {
      return response.status(400).send({ message: 'Não é possível atualizar!' })
    }

    try {
      await category.merge(data).save()

      return response.status(200).send({ message: 'Categoria atualizada com sucesso!' })
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível atualizar a Categoria.' })
    }
  }
  // Deletar Categoria
  public async destroy({ response, auth, params }: HttpContextContract) {
    const { id } = auth.use('api').user!
    try {
      const category = await Category.findByOrFail('lqid', params.lqid)

      if (category.userId !== id) {
        return response.status(400).send({ message: 'Não é possível deletar!' })
      }

      await category.delete()

      return response.status(200).send({ message: 'Categoria excluída!' })
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível excluir!' })
    }
  }
}
