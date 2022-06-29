import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import StoreSetting from 'App/Models/StoreSetting'
import Store from 'App/Models/Store'
import {
  StoreSettingValidator,
  StoreSettingUpdateValidator,
} from 'App/Validators/Client/Store/StoreSettingValidator'

export default class StoreSettingsController {
  // Criar configurações
  public async store({ request, response, auth }: HttpContextContract) {
    const { id } = auth.use('api').user!
    const data = await request.validate(StoreSettingValidator)

    const settings = await StoreSetting.findBy('user_id', id)

    if (settings) {
      return response.status(400).send({ message: 'Loja já possui configurações.' })
    }

    const store = await Store.findByOrFail('user_id', id)

    try {
      await StoreSetting.create({ ...data, storeId: store.id, userId: id })

      return response.status(201).send({ message: 'Configurações criadas com sucesso!' })
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível criar as configurações.' })
    }
  }
  // Exibir configurações
  public async show({ response, auth }: HttpContextContract) {
    const { id } = auth.use('api').user!
    try {
      const settings = await StoreSetting.findByOrFail('user_id', id)

      return response.status(200).send(settings)
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível exibir as configurações!' })
    }
  }

  // Atualizar configurações
  public async update({ response, request, auth }: HttpContextContract) {
    const { id } = auth.use('api').user!
    const data = await request.validate(StoreSettingUpdateValidator)

    const settings = await StoreSetting.findByOrFail('user_id', id)

    try {
      await settings.merge(data).save()

      return response.status(200).send({ message: 'Configurações atualizadas com sucesso!' })
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível atualizar as configurações.' })
    }
  }
}
