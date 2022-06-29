import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Customer from 'App/Models/User'
import { DateTime } from 'luxon'
import { v4 as uuid } from 'uuid'
import Mail from '@ioc:Adonis/Addons/Mail'
import { PasswordValidator } from 'App/Validators/Public/Auth/PasswordValidator'

export default class PasswordController {
  public async forgot({ request, response }: HttpContextContract) {
    const email = request.input('email')
    try {
      const user = await Customer.findByOrFail('email', email)

      user.tokenPass = uuid()
      user.tokenPassCreatedAt = DateTime.now().setLocale('pt-BR').setZone('America/Sao_Paulo')

      await user.save()

      await Mail.send((message) => {
        message
          .from('ola@loquaz.com.br')
          .to(email)
          .subject('Loquaz - Recuperação de senha')
          .htmlView('emails/forgot_password', {
            user: { fullName: user.name, token: user.tokenPass },
          })
      })

      return response.status(200).send({ message: 'Solicitação enviada com sucesso!' })
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível enviar a solicitação!' })
    }
  }

  public async update({ request, response }: HttpContextContract) {
    const { tokenPass, email, password } = await request.validate(PasswordValidator)

    try {
      const user = await Customer.findByOrFail('token_pass', tokenPass)

      if (user.email !== email || tokenPass === null) {
        return response
          .status(401)
          .send({ error: { message: 'Não foi possível atualizar a senha!' } })
      }

      const tokenExpired = DateTime.now().diff(
        DateTime.fromISO(String(user.tokenPassCreatedAt)),
        'minutes'
      )

      if (Number(tokenExpired.toObject().minutes) > 30) {
        return response.status(401).send({ error: { message: 'Token de recuperação expirou!' } })
      }

      user.tokenPass = null
      user.tokenPassCreatedAt = null
      user.password = password

      await user.save()

      return response.status(200).send({ message: 'Senha atualizada com sucesso!' })
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível enviar a solicitação!' })
    }
  }
}
