import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Coupon from 'App/Models/Coupon'
import Store from 'App/Models/Store'
import Database from '@ioc:Adonis/Lucid/Database'
import {
  CouponValidator,
  CouponUpdateValidator,
} from 'App/Validators/Client/Coupon/CouponValidator'

export default class CouponsController {
  // Criar cupom
  public async store({ request, response, auth }: HttpContextContract) {
    const { id } = auth.use('api').user!
    const trx = await Database.transaction()

    const store = await Store.findByOrFail('user_id', id)

    let canUseFor = {
      product: false,
    }

    const data = await request.validate(CouponValidator)

    try {
      let coupon = await Coupon.create({ ...data, storeId: store.id, userId: id }, { client: trx })

      if (data.products && data.products.length > 0) {
        await coupon.related('products').sync(data.products)
        canUseFor.product = true
      }

      if (canUseFor.product) {
        coupon.canUseFor = 'product'
      } else {
        coupon.canUseFor = 'all'
      }

      await coupon.save()
      await trx.commit()

      return response.status(201).send(coupon)
    } catch (error) {
      await trx.rollback()
      return response.status(400).send({ message: 'Não foi possível criar o cupom no momento!' })
    }
  }
  // Listar cupons
  public async index({ response, request, auth }: HttpContextContract) {
    const { id } = auth.use('api').user!
    const page = request.input('page', 1)
    const limit = 5

    try {
      const coupons = await Coupon.query().where('user_id', id).paginate(page, limit)

      return response.status(200).send(coupons)
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível exibir os cupons.' })
    }
  }
  // Listar um cupom
  public async show({ response, params, auth }: HttpContextContract) {
    const { id } = auth.use('api').user!

    try {
      const coupon = await Coupon.findByOrFail('lqid', params.lqid)

      if (coupon.userId !== id) {
        return response.status(400).send({ message: 'Não foi possível exibir o cupom.' })
      }

      return response.status(200).send(coupon)
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível exibir o cupom.' })
    }
  }
  // Atualizar cupom
  public async update({ response, request, params, auth }: HttpContextContract) {
    const { id } = auth.use('api').user!
    const data = await request.validate(CouponUpdateValidator)

    const coupon = await Coupon.findByOrFail('lqid', params.lqid)

    if (coupon.userId !== id) {
      return response.status(400).send({ message: 'Não é possível atualizar!' })
    }

    try {
      await coupon.merge(data).save()

      return response.status(200).send({ message: 'Cupom atualizado com sucesso!' })
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível atualizar o Cupom.' })
    }
  }
  // Deletar cupom
  public async destroy({ response, auth, params }: HttpContextContract) {
    const { id } = auth.use('api').user!
    try {
      const coupon = await Coupon.findByOrFail('lqid', params.lqid)

      if (coupon.userId !== id) {
        return response.status(400).send({ message: 'Não é possível deletar!' })
      }

      await coupon.delete()

      return response.status(200).send({ message: 'Cupom excluído!' })
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível excluir!' })
    }
  }
}
