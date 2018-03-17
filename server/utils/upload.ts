import * as path from "path"
import * as multer from "multer"
export class Upload {
  storage: multer.StorageEngine
  constructor(uploadPath?: string) {
    this.storage = multer.diskStorage({
      destination: function(req, file, cb) {
        cb(null, uploadPath || "upload/")
      },
      filename: function(req, file, cb) {
        cb(
          null,
          file.originalname + "-" + Date.now() + path.extname(file.originalname)
        )
      }
    })
  }

  public getInstance() {
    return multer({ storage: this.storage })
  }
}

export const uploader = new Upload().getInstance()
