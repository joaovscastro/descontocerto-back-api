import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Customer from 'App/Models/Customer'
import { v4 as uuid } from 'uuid'
import Mail from '@ioc:Adonis/Addons/Mail'
import {
  SignupValidator,
  SigninValidator,
  ActiveValidator,
} from 'App/Validators/Public/Auth/AuthValidator'

export default class AuthController {
  // Criar conta
  public async signup({ request, response }: HttpContextContract) {
    const data = await request.validate(SignupValidator)

    try {
      const token = uuid()

      await Customer.create({
        ...data,
        token,
      })

      await Mail.send((message) => {
        message
          .from('ola@loquaz.com.br')
          .to(data.email)
          .subject('Loquaz - Ative sua conta')
          .htmlView('emails/welcome', {
            user: { fullName: data.name, token: token },
          })
      })

      return response.status(200).send({ message: 'Conta criada!' })
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível criar a conta!' })
    }
  }
  // Fazer login
  public async signin({ request, response, auth }: HttpContextContract) {
    const { email, password } = await request.validate(SigninValidator)

    try {
      const token = await auth
        .use('apiCustomer')
        .attempt(email, password, { name: 'loquaz-web', expiresIn: '1days' })
      return token
    } catch (err) {
      console.log(err)
      return response.status(400).send({ message: 'Não foi possível entrar!' })
    }
  }

  // Ativar usuário
  public async active({ request, response }: HttpContextContract) {
    const { token, email } = await request.validate(ActiveValidator)

    try {
      const user = await Customer.findByOrFail('token', token)

      if (user.email !== email || token === null) {
        return response.status(400).send({ error: { message: 'Não foi possível ativar a conta!' } })
      }

      user.token = null
      user.active = true

      await user.save()

      return response.status(200).send({ message: 'Conta ativada!' })
    } catch {
      return response.status(400).send({ message: 'Não foi possível ativar a conta!' })
    }
  }
}
