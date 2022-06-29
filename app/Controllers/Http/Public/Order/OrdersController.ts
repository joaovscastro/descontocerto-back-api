import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Order from 'App/Models/Order'
import Store from 'App/Models/Store'
import Database from '@ioc:Adonis/Lucid/Database'
import crypto from 'crypto'
import { OrderValidator } from 'App/Validators/Public/Order/OrderValidator'

export default class OrdersController {
  // Criar pedido
  public async store({ request, response, auth }: HttpContextContract) {
    const { id } = auth.use('apiCustomer').user!
    const trx = await Database.transaction()
    const data = await request.validate(OrderValidator)

    const store = await Store.findByOrFail('id', data.storeId)

    const numberRandom = crypto.randomBytes(2).toString('hex')
    const number = (store.prefix + numberRandom).toUpperCase()

    const transaction = crypto.randomBytes(2).toString('hex')

    try {
      const order = await Order.create(
        { ...data, userId: id, number, transaction },
        { client: trx }
      )
      const orderItems = await order.related('items').createMany(data.items, trx)

      await order.related('address').createMany(data.address, trx)

      let sum = orderItems.reduce(function (a, b) {
        return a + b.subtotal
      }, 0)

      await order.merge({ total: sum }).useTransaction(trx).save()

      await trx.commit()

      return response.status(201).send(order)
    } catch (err) {
      console.log(err)
      await trx.rollback()
      return response.status(400).send({ message: 'Não foi possível criar o pedido.' })
    }
  }
  // Listar pedidos
  public async index({ response, request, auth }: HttpContextContract) {
    const { id } = auth.use('apiCustomer').user!
    const number = request.input('number')
    const store = request.input('store')
    const status = request.input('status')
    const page = request.input('page', 1)
    const limit = 6

    const query = Order.query()

    if (number) {
      query.where('number', 'ILIKE', `%${number}%`)
    }

    if (status) {
      query.where('status', 'ILIKE', `%${status}%`)
    }

    try {
      const orders = await query
        .from('orders')
        .where('store_id', store)
        .where('user_id', id)
        .paginate(page, limit)

      return response.status(200).send(orders)
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível exibir os pedidos.' })
    }
  }
  // Listar um pedido
  public async show({ response, params, auth }: HttpContextContract) {
    const { id } = auth.use('apiCustomer').user!

    try {
      const order = await Order.findByOrFail('lqid', params.lqid)

      if (order.userId !== id) {
        return response.status(400).send({ message: 'Não foi possível exibir o pedido.' })
      }

      return response.status(200).send(order)
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível exibir o pedido.' })
    }
  }
}
