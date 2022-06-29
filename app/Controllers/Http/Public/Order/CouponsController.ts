import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Coupon from 'App/Models/Coupon'
import Order from 'App/Models/Order'
import CouponOrder from 'App/Models/CouponOrder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class CouponsController {
  public async store({ request, response, auth }: HttpContextContract) {
    const { code } = request.all()
    const coupon = await Coupon.findByOrFail('code', code)

    const order = await Order.findOrFail(3)
    let autorizar = false

    try {
      // Verificar validade do cupom
      // Verificar se está associado a um produto
      const couponProducts = await Database.from('coupon_product')
        .where('coupon_id', coupon.id)
        .select('product_id')

      if (couponProducts.length < 1) {
        // Não estã associado a nenhum produto entao o uso e livre
        autorizar = true
      }

      // Verificar se está associado a um produto
      let isAssociatedToProducts = false

      if (Array.isArray(couponProducts) && couponProducts.length > 0) {
        isAssociatedToProducts = true

        console.log(couponProducts)

        const productsMatch = await Database.from('order_items')
          .where('order_id', order.id)
          .whereIn('product_id', [1])
          // .whereIn('product_id', couponProducts)
          .select('product_id')

        if (isAssociatedToProducts && Array.isArray(productsMatch) && productsMatch.length > 0) {
          autorizar = true
        }
      }

      // Aplicar desconto

      if (autorizar) {
        const discount = await CouponOrder.firstOrCreate({
          orderId: order.id,
          couponId: coupon.id,
        })
        return response.status(200).send({ message: 'Cupom aplicado.' })
      }

      return response.status(400).send({ message: 'Não foi possível aplicar o cupom.' })
    } catch (err) {
      console.log(err)
      return response.status(400).send({ message: 'Não foi possível aplicar o cupom.' })
    }
  }
}

/*
  public async store({ request, response, auth }: HttpContextContract) {
    const { code } = request.all()
    const coupon = await Coupon.findByOrFail('code', code.toUpperCase())

    let order = await Order.findOrFail(1)
    let discount = []

    try {
      const service = new Service(order)
      const canAddDiscount = await service.candApplyDiscount(coupon)
      const orderDiscounts = await order.coupons().getCount()

      if (canAddDiscount && orderDiscounts === 0) {
        discount = await Discount.findOrCreate({
          order_id: order.id,
          coupon_id: coupon.id,
        })

        return response.status(200).send({
          message: 'Cupom aplicado com sucesso!',
        })
      } else {
        return response.status(400).send({
          message: 'Não foi possível aplicar o cupom',
        })
      }
    } catch (error) {
      console.log(error)
      return response.status(400).send({
        message: 'Erro ao aplicar o cupom',
      })
    }
  }
*/
