from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse, StreamingResponse
import sys
import os
import json
from io import BytesIO
from typing import List, Optional

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pydantic import BaseModel
from models.template_model import (
    TemplateCreate, 
    TemplateUpdate, 
    TemplateCategoryCreate, 
    TemplateCategoryUpdate,
    TaskFromTemplateCreate
)
from database.template_db import (
    create_template, 
    get_templates, 
    get_template_by_id, 
    update_template, 
    delete_template,
    create_template_category,
    get_template_categories,
    update_template_category,
    delete_template_category
)
from database.task_db import create_task
from models.task_model import TaskCreate
from app.database import get_template_collection, get_template_category_collection, get_task_collection
from app.auth import get_current_user

router = APIRouter()

@router.post("/templates")
def create_template_endpoint(
    template: TemplateCreate, 
    user=Depends(get_current_user), 
    db=Depends(get_template_collection)
):
    try:
        template_id = create_template(db, template, user["_id"])
        return {"template_id": template_id, "message": "Template created successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create template: {str(e)}")

@router.get("/templates")
def read_templates(
    category: Optional[str] = None,
    user=Depends(get_current_user), 
    db=Depends(get_template_collection)
):
    try:
        return get_templates(db, user["_id"], category)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to get templates: {str(e)}")

@router.get("/templates/{template_id}")
def read_template(
    template_id: str, 
    user=Depends(get_current_user), 
    db=Depends(get_template_collection)
):
    try:
        template = get_template_by_id(db, template_id, user["_id"])
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        return template
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to get template: {str(e)}")

@router.put("/templates/{template_id}")
def update_template_endpoint(
    template_id: str, 
    updates: TemplateUpdate, 
    user=Depends(get_current_user), 
    db=Depends(get_template_collection)
):
    try:
        success = update_template(db, template_id, updates, user["_id"])
        if not success:
            raise HTTPException(status_code=404, detail="Template not found or no updates provided")
        return {"message": "Template updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update template: {str(e)}")

@router.delete("/templates/{template_id}")
def delete_template_endpoint(
    template_id: str, 
    user=Depends(get_current_user), 
    db=Depends(get_template_collection)
):
    try:
        success = delete_template(db, template_id, user["_id"])
        if not success:
            raise HTTPException(status_code=404, detail="Template not found")
        return {"message": "Template deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to delete template: {str(e)}")

@router.post("/templates/{template_id}/create-task")
def create_task_from_template(
    template_id: str, 
    task_data: TaskFromTemplateCreate,
    user=Depends(get_current_user), 
    template_db=Depends(get_template_collection),
    task_db=Depends(get_task_collection)
):
    try:
        template = get_template_by_id(template_db, template_id, user["_id"])
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        task_create = TaskCreate(
            title=template["task_title"],
            description=template.get("task_description"),
            priority=template["priority"],
            deadline=task_data.deadline,
            start_time=task_data.start_time,
            end_time=task_data.end_time,
            labels=template.get("labels", []),
            completed=False
        )
        
        task_id = create_task(task_db, task_create, user["_id"])
        
        if task_data.assignee:
            from database.task_db import update_task
            update_task(task_db, task_id, {"assignee": task_data.assignee})
        
        return {"task_id": task_id, "message": "Task created from template successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create task from template: {str(e)}")

@router.post("/template-categories")
def create_category(
    category: TemplateCategoryCreate, 
    user=Depends(get_current_user), 
    db=Depends(get_template_category_collection)
):
    try:
        category_id = create_template_category(db, category, user["_id"])
        return {"category_id": category_id, "message": "Category created successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create category: {str(e)}")

@router.get("/template-categories")
def read_categories(
    user=Depends(get_current_user), 
    db=Depends(get_template_category_collection)
):
    try:
        return get_template_categories(db, user["_id"])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to get categories: {str(e)}")

@router.put("/template-categories/{category_id}")
def update_category(
    category_id: str, 
    updates: TemplateCategoryUpdate, 
    user=Depends(get_current_user), 
    db=Depends(get_template_category_collection)
):
    try:
        success = update_template_category(db, category_id, updates, user["_id"])
        if not success:
            raise HTTPException(status_code=404, detail="Category not found or no updates provided")
        return {"message": "Category updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update category: {str(e)}")

@router.delete("/template-categories/{category_id}")
def delete_category(
    category_id: str, 
    user=Depends(get_current_user), 
    db=Depends(get_template_category_collection)
):
    try:
        success = delete_template_category(db, category_id, user["_id"])
        if not success:
            raise HTTPException(status_code=404, detail="Category not found")
        return {"message": "Category deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to delete category: {str(e)}")

@router.post("/templates/import")
async def import_templates(
    file: UploadFile = File(...),
    user=Depends(get_current_user), 
    db=Depends(get_template_collection)
):
    try:
        if not file.filename.endswith('.json'):
            raise HTTPException(status_code=400, detail="Only JSON files are supported")
        
        content = await file.read()
        templates_data = json.loads(content)
        
        if not isinstance(templates_data, list):
            templates_data = [templates_data]
        
        imported_count = 0
        for template_data in templates_data:
            try:
                template_create = TemplateCreate(
                    name=template_data.get("name", "Imported Template"),
                    description=template_data.get("description"),
                    category=template_data.get("category"),
                    task_title=template_data.get("task_title", template_data.get("name", "Imported Task")),
                    task_description=template_data.get("task_description", template_data.get("description")),
                    priority=template_data.get("priority", "Medium"),
                    labels=template_data.get("labels", []),
                    is_public=template_data.get("is_public", False)
                )
                create_template(db, template_create, user["_id"])
                imported_count += 1
            except Exception as e:
                print(f"Failed to import template: {str(e)}")
                continue
        
        return {"message": f"Successfully imported {imported_count} templates", "imported_count": imported_count}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to import templates: {str(e)}")

@router.get("/templates/export")
def export_templates(
    category: Optional[str] = None,
    user=Depends(get_current_user), 
    db=Depends(get_template_collection)
):
    try:
        templates = get_templates(db, user["_id"], category)
        
        export_data = []
        for template in templates:
            export_data.append({
                "name": template.get("name"),
                "description": template.get("description"),
                "category": template.get("category"),
                "task_title": template.get("task_title"),
                "task_description": template.get("task_description"),
                "priority": template.get("priority"),
                "labels": template.get("labels", []),
                "is_public": template.get("is_public", False)
            })
        
        json_content = json.dumps(export_data, indent=2, ensure_ascii=False)
        bytes_io = BytesIO(json_content.encode('utf-8'))
        
        return StreamingResponse(
            bytes_io,
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename=templates_{category or 'all'}.json"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to export templates: {str(e)}")
