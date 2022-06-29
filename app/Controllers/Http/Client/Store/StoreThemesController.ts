import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import StoreTheme from 'App/Models/StoreTheme'
import Store from 'App/Models/Store'
import {
  StoreThemeValidator,
  StoreThemeUpdateValidator,
} from 'App/Validators/Client/Store/StoreThemeValidator'

export default class StoreThemesController {
  // Criar tema
  public async store({ request, response, auth }: HttpContextContract) {
    const { id } = auth.use('api').user!
    const data = await request.validate(StoreThemeValidator)

    const settings = await StoreTheme.findBy('user_id', id)

    if (settings) {
      return response.status(400).send({ message: 'Loja já possui tema.' })
    }

    const store = await Store.findByOrFail('user_id', id)

    try {
      await StoreTheme.create({ ...data, storeId: store.id, userId: id })

      return response.status(201).send({ message: 'Tema criado com sucesso!' })
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível criar o tema.' })
    }
  }
  // Exibir tema
  public async show({ response, auth }: HttpContextContract) {
    const { id } = auth.use('api').user!
    try {
      const settings = await StoreTheme.findByOrFail('user_id', id)

      return response.status(200).send(settings)
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível exibir o tema!' })
    }
  }

  // Atualizar tema
  public async update({ response, request, auth }: HttpContextContract) {
    const { id } = auth.use('api').user!
    const data = await request.validate(StoreThemeUpdateValidator)

    const settings = await StoreTheme.findByOrFail('user_id', id)

    try {
      await settings.merge(data).save()

      return response.status(200).send({ message: 'Tema atualizado com sucesso!' })
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível atualizar o tema.' })
    }
  }
}
