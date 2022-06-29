import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Variation from 'App/Models/Variation'
import Product from 'App/Models/Product'
import {
  VariationValidator,
  VariationUpdateValidator,
} from 'App/Validators/Client/Product/VariationValidator'

export default class VariationsController {
  // Criar variação
  public async store({ request, response, auth }: HttpContextContract) {
    const { id } = auth.use('api').user!
    const data = await request.validate(VariationValidator)

    try {
      const product = await Product.findByOrFail('lqid', data.productId)

      if (product.userId !== id) {
        return response.status(400).send({ message: 'Não foi possível criar a variação.' })
      }

      await Variation.create({
        ...data,
        productId: product.id,
        userId: id,
        storeId: product.storeId,
      })

      return response.status(201).send({ message: 'Variação criada com sucesso!' })
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível criar a variação.' })
    }
  }
  // Listar variações
  public async index({ response, request, params, auth }: HttpContextContract) {
    const { id } = auth.use('api').user!
    const page = request.input('page', 1)
    const limit = 5

    const product = await Product.findByOrFail('lqid', params.productid)

    if (product.userId !== id) {
      return response.status(400).send({ message: 'Não foi possível exibir as variações.' })
    }

    try {
      const variations = await Variation.query()
        .where('product_id', product.id)
        .where('user_id', id)
        .paginate(page, limit)

      return response.status(200).send(variations)
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível exibir as variações.' })
    }
  }
  // Listar uma variação
  public async show({ response, params, auth }: HttpContextContract) {
    const { id } = auth.use('api').user!

    try {
      const variation = await Variation.findByOrFail('lqid', params.lqid)

      if (variation.userId !== id) {
        return response.status(400).send({ message: 'Não foi possível exibir a variação.' })
      }

      return response.status(200).send(variation)
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível exibir a variação.' })
    }
  }
  // Atualizar Variação
  public async update({ response, request, params, auth }: HttpContextContract) {
    const { id } = auth.use('api').user!
    const data = await request.validate(VariationUpdateValidator)

    const variation = await Variation.findByOrFail('lqid', params.lqid)

    if (variation.userId !== id) {
      return response.status(400).send({ message: 'Não é possível atualizar!' })
    }

    try {
      await variation.merge(data).save()

      return response.status(200).send({ message: 'Variação atualizada com sucesso!' })
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível atualizar a variação.' })
    }
  }
  // Deletar variação
  public async destroy({ response, auth, params }: HttpContextContract) {
    const { id } = auth.use('api').user!
    try {
      const variation = await Variation.findByOrFail('lqid', params.lqid)

      if (variation.userId !== id) {
        return response.status(400).send({ message: 'Não é possível deletar!' })
      }

      await variation.delete()

      return response.status(200).send({ message: 'Variação excluída!' })
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível excluir!' })
    }
  }
}
