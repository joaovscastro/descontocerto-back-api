import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import CustomerAddress from 'App/Models/CustomerAddress'
import {
  AddressValidator,
  AddressUpdateValidator,
} from 'App/Validators/Public/Customer/AddressValidator'

export default class AddressesController {
  // Criar endereço
  public async store({ request, response, auth }: HttpContextContract) {
    const { id } = auth.use('apiCustomer').user!
    const data = await request.validate(AddressValidator)

    try {
      await CustomerAddress.create({ ...data, userId: id })

      return response.status(201).send({ message: 'Endereço criado com sucesso!' })
    } catch (err) {
      console.log(err)
      return response.status(400).send({ message: 'Não foi possível criar o endereço.' })
    }
  }
  // Listar endereços
  public async index({ response, request, auth }: HttpContextContract) {
    const { id } = auth.use('apiCustomer').user!
    const page = request.input('page', 1)
    const limit = 5

    try {
      const addresses = await CustomerAddress.query()
        .where('user_id', id)
        // .preload('files')
        .paginate(page, limit)

      return response.status(200).send(addresses)
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível exibir os endereços.' })
    }
  }
  // Listar um endereço
  public async show({ response, params, auth }: HttpContextContract) {
    const { id } = auth.use('apiCustomer').user!

    try {
      const address = await CustomerAddress.findByOrFail('lqid', params.lqid)

      if (address.userId !== id) {
        return response.status(400).send({ message: 'Não foi possível exibir o endereço.' })
      }

      return response.status(200).send(address)
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível exibir o endereço.' })
    }
  }
  // Atualizar Endereço
  public async update({ response, request, params, auth }: HttpContextContract) {
    const { id } = auth.use('apiCustomer').user!
    const data = await request.validate(AddressUpdateValidator)

    const address = await CustomerAddress.findByOrFail('lqid', params.lqid)

    if (address.userId !== id) {
      return response.status(400).send({ message: 'Não é possível atualizar!' })
    }

    try {
      await address.merge(data).save()

      return response.status(200).send({ message: 'Endereço atualizado com sucesso!' })
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível atualizar o Endereço.' })
    }
  }
  // Deletar endereço
  public async destroy({ response, auth, params }: HttpContextContract) {
    const { id } = auth.use('apiCustomer').user!
    try {
      const address = await CustomerAddress.findByOrFail('lqid', params.lqid)

      if (address.userId !== id) {
        return response.status(400).send({ message: 'Não é possível deletar!' })
      }

      await address.delete()

      return response.status(200).send({ message: 'Endereço excluído!' })
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível excluir!' })
    }
  }
}
