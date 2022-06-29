import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Store from 'App/Models/Store'
import crypto from 'crypto'
import {
  StoreValidator,
  UpdateUsernameValidator,
  UpdateDomainValidator,
} from 'App/Validators/Client/Store/StoreValidator'

export default class StoresController {
  // Verificar usuário
  public async verify({ response, params }: HttpContextContract) {
    try {
      await Store.findByOrFail('username', params.username)

      return response.status(400).send({ message: 'Nome de usuário em uso!' })
    } catch (err) {
      return response.status(200).send({ message: 'Usuário disponível!' })
    }
  }
  // Criar loja
  public async store({ request, response, auth }: HttpContextContract) {
    const { id } = auth.use('api').user!
    const { username } = await request.validate(StoreValidator)

    const store = await Store.findBy('user_id', id)

    if (store) {
      return response.status(400).send({ message: 'Usuário já possui loja.' })
    }

    try {
      const prefixUser = username.substring(0, 2)
      const prefixRandom = crypto.randomBytes(2).toString('hex')
      const prefix = (prefixUser + prefixRandom).toUpperCase()

      await Store.create({ username, domain: `${username}.loquaz.com`, userId: id, prefix })

      return response.status(201).send({ message: 'Loja criada com sucesso!' })
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível criar a loja.' })
    }
  }
  // Exibir loja
  public async show({ response, auth }: HttpContextContract) {
    const { id } = auth.use('api').user!
    try {
      const store = await Store.findByOrFail('user_id', id)

      return response.status(200).send(store)
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível exibir a loja!' })
    }
  }
  // Atualizar nome de usuário da loja
  public async updateUsername({ response, request, auth }: HttpContextContract) {
    const { username } = await request.validate(UpdateUsernameValidator)
    const { id } = auth.use('api').user!
    const store = await Store.findByOrFail('user_id', id)

    try {
      if (!store.customDomain) {
        await store.merge({ username, domain: `${username}.loquaz.com` }).save()

        return response.status(200).send({ message: 'Nome de usuário atualizado com sucesso!' })
      }
      await store.merge({ username }).save()

      return response.status(200).send({ message: 'Nome de usuário atualizado com sucesso!' })
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível atualizar o nome de usuário.' })
    }
  }
  // Atualizar domínio da loja
  public async updateDomain({ response, request, auth }: HttpContextContract) {
    const data = await request.validate(UpdateDomainValidator)
    const { id } = auth.use('api').user!
    const store = await Store.findByOrFail('user_id', id)

    try {
      await store.merge(data).save()

      return response.status(200).send({ message: 'Domínio atualizado com sucesso!' })
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível atualizar o domínio.' })
    }
  }
}
