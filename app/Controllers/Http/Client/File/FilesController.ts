import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { FileValidator } from 'App/Validators/Client/File/FileValidator'
import File from 'App/Models/File'
import Database from '@ioc:Adonis/Lucid/Database'
import Drive from '@ioc:Adonis/Core/Drive'

export default class FilesController {
  public async upload({ request, response, auth }: HttpContextContract) {
    const { id } = auth.use('api').user!
    const postData = await request.validate(FileValidator)

    try {
      await postData.file.moveToDisk('images', {}, 's3')

      await File.create({
        userId: id,
        name: postData.file.clientName,
        type: postData.file.type,
        subtype: postData.file.subtype,
        path: postData.file.fileName,
        key: postData.file.fileName,
      })

      return response.status(200).send({ message: 'Upload feito!' })
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível fazer upload!' })
    }
  }

  public async index({ response, auth }: HttpContextContract) {
    const { id } = auth.use('api').user!
    const files = await Database.from('files').where('user_id', id).paginate(1, 10)

    return response.status(200).send(files)
  }

  public async destroy({ response, auth, params }: HttpContextContract) {
    const { id } = auth.use('api').user!
    try {
      const file = await File.findByOrFail('lqid', params.lqid)

      if (id !== file.userId) {
        return response.status(400).send({ message: 'Não é possível deletar!' })
      }

      await Drive.use('s3').delete(file.key)

      await file.delete()

      return response.status(200).send({ message: 'Arquivo excluído!' })
    } catch (err) {
      return response.status(400).send({ message: 'Não foi possível excluir!' })
    }
  }
}
