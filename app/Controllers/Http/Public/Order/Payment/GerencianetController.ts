import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Gerencianet from 'gn-api-sdk-typescript'
import options from '../../../../../../config'

export default class GerencianetController {
  public async bankingBillet({ response }: HttpContextContract) {
    // buscar dados de gerencianet do cliente
    // const gnAccount = await GnPayment.findByOrFail('store_id', id)

    // const order = await Order.findByOrFail('id', id)

    // await order.load('customer' )
    // await order.load('address' )

    const body = {
      payment: {
        banking_billet: {
          expire_at: '2022-06-01',
          customer: {
            name: 'Gorbadoc Oldbuck',
            email: 'oldbuck@gerencianet.com.br',
            cpf: '94271564656',
            birth: '1977-01-15',
            phone_number: '5144916523',
          },
        },
      },

      items: [
        {
          name: 'Product 1',
          value: 500,
          amount: 1,
          marketplace: {
            repasses: [
              {
                payee_code: 'informe_payee_code_conta',
                percentage: 2500,
              },
              {
                payee_code: 'informe_payee_code_conta',
                percentage: 1500,
              },
            ],
          },
        },
      ],
      // shippings: [
      //   {
      //     name: 'Default Shipping Cost',
      //     value: 100,
      //   },
      // ],
      //metadata: {
      // custom_id: '0987',
      // notification_url: 'https://api.loquaz.net/v1/notification/order?id=232323',
      // },
    }

    const gerencianet = Gerencianet(options)

    try {
      const pagamento = await gerencianet.oneStep([], body)

      return pagamento
    } catch (err) {
      console.log(err)
      return response.status(400).send({ message: 'Não foi possível gerar cobrança!' })
    }
  }
}
