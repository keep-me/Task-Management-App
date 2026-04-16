from bson import ObjectId
from pymongo.collection import Collection
from models.template_model import TemplateCreate, TemplateUpdate, TemplateCategoryCreate, TemplateCategoryUpdate
from datetime import datetime
from typing import List, Dict, Any

def create_template(db: Collection, template_data: TemplateCreate, user_id: str):
    template_dict = template_data.dict()
    template_dict["user_id"] = user_id
    template_dict["created_at"] = datetime.utcnow()
    template_dict["updated_at"] = datetime.utcnow()
    result = db.insert_one(template_dict)
    return str(result.inserted_id)

def get_templates(db: Collection, user_id: str, category: str = None):
    query = {"$or": [{"user_id": user_id}, {"is_public": True}]}
    if category:
        query["category"] = category
    templates = db.find(query)
    result = []
    for template in templates:
        template["_id"] = str(template["_id"])
        if "created_at" in template and isinstance(template["created_at"], datetime):
            template["created_at"] = template["created_at"].isoformat()
        if "updated_at" in template and isinstance(template["updated_at"], datetime):
            template["updated_at"] = template["updated_at"].isoformat()
        result.append(template)
    return result

def get_template_by_id(db: Collection, template_id: str, user_id: str):
    query = {"$or": [{"user_id": user_id}, {"is_public": True}]}
    
    if template_id.startswith("mock_id_"):
        query["_id"] = template_id
    else:
        try:
            query["_id"] = ObjectId(template_id)
        except:
            query["_id"] = template_id
    
    template = db.find_one(query)
    if template:
        template["_id"] = str(template["_id"])
        if "created_at" in template and isinstance(template["created_at"], datetime):
            template["created_at"] = template["created_at"].isoformat()
        if "updated_at" in template and isinstance(template["updated_at"], datetime):
            template["updated_at"] = template["updated_at"].isoformat()
    return template

def update_template(db: Collection, template_id: str, updates: TemplateUpdate, user_id: str):
    update_dict = {k: v for k, v in updates.dict().items() if v is not None}
    if not update_dict:
        return False
    
    update_dict["updated_at"] = datetime.utcnow()
    
    if template_id.startswith("mock_id_"):
        result = db.update_one({"_id": template_id, "user_id": user_id}, {"$set": update_dict})
    else:
        try:
            result = db.update_one({"_id": ObjectId(template_id), "user_id": user_id}, {"$set": update_dict})
        except:
            result = db.update_one({"_id": template_id, "user_id": user_id}, {"$set": update_dict})
    
    return result.modified_count > 0

def delete_template(db: Collection, template_id: str, user_id: str):
    if template_id.startswith("mock_id_"):
        result = db.delete_one({"_id": template_id, "user_id": user_id})
    else:
        try:
            result = db.delete_one({"_id": ObjectId(template_id), "user_id": user_id})
        except:
            result = db.delete_one({"_id": template_id, "user_id": user_id})
    
    return result.deleted_count > 0

def create_template_category(db: Collection, category_data: TemplateCategoryCreate, user_id: str):
    category_dict = category_data.dict()
    category_dict["user_id"] = user_id
    category_dict["created_at"] = datetime.utcnow()
    result = db.insert_one(category_dict)
    return str(result.inserted_id)

def get_template_categories(db: Collection, user_id: str):
    categories = db.find({"user_id": user_id})
    result = []
    for category in categories:
        category["_id"] = str(category["_id"])
        if "created_at" in category and isinstance(category["created_at"], datetime):
            category["created_at"] = category["created_at"].isoformat()
        result.append(category)
    return result

def update_template_category(db: Collection, category_id: str, updates: TemplateCategoryUpdate, user_id: str):
    update_dict = {k: v for k, v in updates.dict().items() if v is not None}
    if not update_dict:
        return False
    
    if category_id.startswith("mock_id_"):
        result = db.update_one({"_id": category_id, "user_id": user_id}, {"$set": update_dict})
    else:
        try:
            result = db.update_one({"_id": ObjectId(category_id), "user_id": user_id}, {"$set": update_dict})
        except:
            result = db.update_one({"_id": category_id, "user_id": user_id}, {"$set": update_dict})
    
    return result.modified_count > 0

def delete_template_category(db: Collection, category_id: str, user_id: str):
    if category_id.startswith("mock_id_"):
        result = db.delete_one({"_id": category_id, "user_id": user_id})
    else:
        try:
            result = db.delete_one({"_id": ObjectId(category_id), "user_id": user_id})
        except:
            result = db.delete_one({"_id": category_id, "user_id": user_id})
    
    return result.deleted_count > 0
