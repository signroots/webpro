import express, { Request, Response } from "express";
import DomainSource from "../models/DomainSource";
import multer from "multer";

const router = express.Router();


// ===============================
// MULTER CONFIG
// ===============================
import path from "path";
import fs from "fs";


const storage = multer.diskStorage({

  destination:(req,file,cb)=>{

    const uploadPath =
      path.join(__dirname,"../../uploads/domainsources");


    if(!fs.existsSync(uploadPath)){
      fs.mkdirSync(uploadPath,{
        recursive:true
      });
    }


    cb(null,uploadPath);

  },


  filename:(req,file,cb)=>{

    const uniqueName =
      Date.now() +
      "-" +
      file.originalname;


    cb(null,uniqueName);

  }

});


const upload = multer({
  storage
});


/*
======================================================
 CREATE DOMAIN SOURCE
======================================================
*/

router.post(
  "/",
  upload.single("image"),
  async (req: Request, res: Response) => {

  try {

    console.log("CREATE BODY:", req.body);
    console.log("CREATE FILE:", req.file);
const {
  name,
  code
} = req.body;




    if (!name || !code) {

      return res.status(400).json({
        success:false,
        message:"Name and code are required"
      });

    }



    const existing =
      await DomainSource.findOne({
        code: code.toUpperCase()
      });



    if(existing){

      return res.status(400).json({
        success:false,
        message:"Domain source already exists"
      });

    }



    const imageName = req.file?.filename || "";

const source =
await DomainSource.create({

  name,

  code: code.toUpperCase(),

  image: imageName,

  is_active: true

});



    return res.status(201).json({

      success:true,

      data:source

    });



  } catch(error:any){

    console.error(
      "DOMAIN SOURCE CREATE ERROR",
      error
    );


    return res.status(500).json({

      success:false,

      message:"Server error"

    });

  }

});



/*
======================================================
 GET ALL DOMAIN SOURCES
======================================================
*/

router.get(
"/",
async (_req:Request,res:Response)=>{

try{


const sources =
await DomainSource.find()
.sort({
 name:1
});



return res.json({

 success:true,

 data:sources

});



}catch(error:any){


return res.status(500).json({

 success:false,

 message:"Server error"

});


}


});





/*
======================================================
 UPDATE DOMAIN SOURCE
======================================================
*/

router.put(
  "/:id",
  upload.single("image"),
  async (req: Request, res: Response) => {

    try {

      console.log("UPDATE BODY:", req.body);
      console.log("UPDATE FILE:", req.file);


      const {
        name,
        code,
        is_active
      } = req.body;



      if(!name || !code){

        return res.status(400).json({
          success:false,
          message:"Name and code required"
        });

      }



      let imagePath = "";
if(req.file){

  imagePath = req.file.filename;

}
else {

  imagePath = req.body.image || "";

}



      const source =
      await DomainSource.findByIdAndUpdate(

        req.params.id,

        {

          name,

          code:code.toUpperCase(),

          image:imagePath,

          is_active:
            is_active === "true" ||
            is_active === true

        },

        {
          new:true,
          runValidators:true
        }

      );



      if(!source){

        return res.status(404).json({

          success:false,

          message:"Domain source not found"

        });

      }



      return res.json({

        success:true,

        data:source

      });



    } catch(error:any){

      console.error(
        "DOMAIN SOURCE UPDATE ERROR:",
        error
      );


      return res.status(500).json({

        success:false,

        message:"Update failed",

        error:error.message

      });


    }

});


export default router;