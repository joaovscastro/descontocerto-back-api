import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Mail from '@ioc:Adonis/Addons/Mail'
import { v4 as uuid } from 'uuid'
import Customer from 'App/Models/Customer'
import { CustomerUpdateValidator } from 'App/Validators/Public/Customer/CustomerValidator'

export default class CustomersController {
  // Exibir dados
  public async show({ response, auth }: HttpContextContract) {
    const { id } = auth.use('apiCustomer').user!

    try {
      const profile = await Customer.findByOrFail('id', id)

      return response.status(200).send(profile)
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível exibir o perfil.' })
    }
  }
  // Atualizar dados
  public async update({ response, request, auth }: HttpContextContract) {
    const { id } = auth.use('apiCustomer').user!
    const data = await request.validate(CustomerUpdateValidator)

    const profile = await Customer.findByOrFail('id', id)

    try {
      if (data.email) {
        const token = uuid()
        profile.active = false
        profile.token = token

        const newEmail = data.email

        // Envia para o e-mail novo
        await Mail.send((message) => {
          message
            .from('ola@loquaz.com.br')
            .to(newEmail)
            .subject('Loquaz - Confirme seu novo e-mail')
            .htmlView('emails/welcome', {
              user: { fullName: profile.name, token: token },
            })
        })

        // Envia para o e-mail antigo
        await Mail.send((message) => {
          message
            .from('ola@loquaz.com.br')
            .to(profile.email)
            .subject('Loquaz - Seu e-mail foi atualizado')
            .htmlView('emails/welcome', {
              user: { fullName: profile.name, token: token },
            })
        })
      }

      await profile.merge(data).save()

      return response.status(200).send({ message: 'Perfil atualizado com sucesso!' })
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível atualizar o Perfil.' })
    }
  }
}
