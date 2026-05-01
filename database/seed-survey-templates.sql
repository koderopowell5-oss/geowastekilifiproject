-- Seed default survey templates
-- This script populates the survey_templates table with common survey templates
-- Run after migration_007_custom_surveys.sql

INSERT INTO survey_templates (name, description, category, form_config, created_at) VALUES
(
  'Waste Management Survey',
  'Comprehensive survey for waste collection and management data',
  'Waste Management',
  '{
    "sections": [
      {
        "id": "section_waste_type",
        "title": "Waste Type & Quantity",
        "description": "Information about waste collection",
        "fields": [
          {
            "id": "field_waste_type",
            "type": "multiselect",
            "label": "Type of Waste",
            "name": "waste_type",
            "required": true,
            "options": ["Organic", "Plastic", "Paper", "Glass", "Metal", "Electronic", "Hazardous", "Other"]
          },
          {
            "id": "field_quantity",
            "type": "number",
            "label": "Quantity (kg)",
            "name": "quantity_kg",
            "required": true,
            "placeholder": "Enter weight in kilograms",
            "minValue": 0
          },
          {
            "id": "field_container_type",
            "type": "select",
            "label": "Container Type",
            "name": "container_type",
            "required": true,
            "options": ["Bin", "Bag", "Truck", "Wheelbarrow", "Other"]
          }
        ]
      },
      {
        "id": "section_collection_details",
        "title": "Collection Details",
        "fields": [
          {
            "id": "field_collection_date",
            "type": "date",
            "label": "Collection Date",
            "name": "collection_date",
            "required": true
          },
          {
            "id": "field_collection_time",
            "type": "time",
            "label": "Collection Time",
            "name": "collection_time",
            "required": true
          },
          {
            "id": "field_location",
            "type": "location",
            "label": "Collection Location",
            "name": "location",
            "required": true
          },
          {
            "id": "field_condition",
            "type": "select",
            "label": "Waste Condition",
            "name": "waste_condition",
            "required": true,
            "options": ["Clean", "Contaminated", "Wet", "Hazardous"]
          }
        ]
      },
      {
        "id": "section_disposal",
        "title": "Disposal Information",
        "fields": [
          {
            "id": "field_disposal_method",
            "type": "select",
            "label": "Disposal Method",
            "name": "disposal_method",
            "required": true,
            "options": ["Landfill", "Incineration", "Recycling", "Composting", "Energy Recovery"]
          },
          {
            "id": "field_disposal_facility",
            "type": "text",
            "label": "Disposal Facility Name",
            "name": "disposal_facility",
            "required": false,
            "placeholder": "e.g., Central Landfill"
          },
          {
            "id": "field_cost",
            "type": "number",
            "label": "Disposal Cost (KES)",
            "name": "disposal_cost",
            "required": false,
            "minValue": 0
          }
        ]
      },
      {
        "id": "section_notes",
        "title": "Additional Notes",
        "fields": [
          {
            "id": "field_notes",
            "type": "textarea",
            "label": "Comments",
            "name": "notes",
            "required": false,
            "placeholder": "Any additional observations or issues"
          },
          {
            "id": "field_photo",
            "type": "image",
            "label": "Photo Evidence",
            "name": "photo",
            "required": false
          }
        ]
      }
    ],
    "metadata": {
      "language": "en",
      "allowOfflineMode": true,
      "allowDrafts": true
    }
  }',
  NOW()
),
(
  'Environmental Assessment Survey',
  'Survey for environmental impact and quality assessment',
  'Environmental',
  '{
    "sections": [
      {
        "id": "section_environmental_impact",
        "title": "Environmental Impact Assessment",
        "description": "Evaluate environmental conditions and impact",
        "fields": [
          {
            "id": "field_air_quality",
            "type": "rating",
            "label": "Air Quality (1-5)",
            "name": "air_quality",
            "required": true
          },
          {
            "id": "field_water_quality",
            "type": "rating",
            "label": "Water Quality (1-5)",
            "name": "water_quality",
            "required": true
          },
          {
            "id": "field_soil_condition",
            "type": "select",
            "label": "Soil Condition",
            "name": "soil_condition",
            "required": true,
            "options": ["Excellent", "Good", "Fair", "Poor", "Contaminated"]
          },
          {
            "id": "field_vegetation",
            "type": "select",
            "label": "Vegetation Status",
            "name": "vegetation",
            "required": true,
            "options": ["Dense", "Moderate", "Sparse", "Degraded", "None"]
          }
        ]
      },
      {
        "id": "section_biodiversity",
        "title": "Biodiversity Observations",
        "fields": [
          {
            "id": "field_wildlife_spotted",
            "type": "multiselect",
            "label": "Wildlife Observed",
            "name": "wildlife_spotted",
            "required": false,
            "options": ["Birds", "Mammals", "Insects", "Reptiles", "Amphibians", "None"]
          },
          {
            "id": "field_threatened_species",
            "type": "text",
            "label": "Any Threatened Species?",
            "name": "threatened_species",
            "required": false,
            "placeholder": "List any endangered species observed"
          },
          {
            "id": "field_location_coords",
            "type": "location",
            "label": "Survey Location",
            "name": "survey_location",
            "required": true
          }
        ]
      },
      {
        "id": "section_mitigation",
        "title": "Mitigation Measures",
        "fields": [
          {
            "id": "field_measures_implemented",
            "type": "textarea",
            "label": "Mitigation Measures Implemented",
            "name": "mitigation_measures",
            "required": false,
            "placeholder": "Describe any environmental protection measures"
          },
          {
            "id": "field_effectiveness",
            "type": "rating",
            "label": "Measure Effectiveness (1-5)",
            "name": "measure_effectiveness",
            "required": false
          }
        ]
      }
    ],
    "metadata": {
      "language": "en",
      "allowOfflineMode": true,
      "allowDrafts": true
    }
  }',
  NOW()
),
(
  'Community Impact Survey',
  'Survey for assessing community and social impact',
  'Community',
  '{
    "sections": [
      {
        "id": "section_community_info",
        "title": "Community Information",
        "fields": [
          {
            "id": "field_community_name",
            "type": "text",
            "label": "Community/Village Name",
            "name": "community_name",
            "required": true
          },
          {
            "id": "field_population",
            "type": "number",
            "label": "Estimated Population",
            "name": "population",
            "required": true,
            "minValue": 0
          },
          {
            "id": "field_location",
            "type": "location",
            "label": "Community Location",
            "name": "location",
            "required": true
          }
        ]
      },
      {
        "id": "section_health_safety",
        "title": "Health & Safety Concerns",
        "fields": [
          {
            "id": "field_health_issues",
            "type": "multiselect",
            "label": "Health Issues Reported",
            "name": "health_issues",
            "required": false,
            "options": ["Respiratory Problems", "Skin Conditions", "Water-borne Diseases", "Waste-related Illnesses", "None Reported"]
          },
          {
            "id": "field_safety_concerns",
            "type": "textarea",
            "label": "Safety Concerns",
            "name": "safety_concerns",
            "required": false,
            "placeholder": "Describe any safety hazards or concerns"
          },
          {
            "id": "field_risk_level",
            "type": "select",
            "label": "Risk Level",
            "name": "risk_level",
            "required": true,
            "options": ["Low", "Medium", "High", "Critical"]
          }
        ]
      },
      {
        "id": "section_livelihoods",
        "title": "Livelihoods & Economy",
        "fields": [
          {
            "id": "field_primary_livelihood",
            "type": "select",
            "label": "Primary Livelihood",
            "name": "primary_livelihood",
            "required": true,
            "options": ["Agriculture", "Waste Picking", "Small Business", "Employment", "Subsistence", "Other"]
          },
          {
            "id": "field_waste_pickers",
            "type": "number",
            "label": "Number of Waste Pickers in Community",
            "name": "waste_pickers",
            "required": false,
            "minValue": 0
          },
          {
            "id": "field_income_impact",
            "type": "select",
            "label": "Impact on Income",
            "name": "income_impact",
            "required": false,
            "options": ["Positive", "Neutral", "Negative"]
          }
        ]
      },
      {
        "id": "section_solutions",
        "title": "Community Solutions & Recommendations",
        "fields": [
          {
            "id": "field_community_priorities",
            "type": "textarea",
            "label": "Community Priorities",
            "name": "community_priorities",
            "required": false,
            "placeholder": "What does the community want to prioritize?"
          },
          {
            "id": "field_proposed_solutions",
            "type": "textarea",
            "label": "Proposed Solutions",
            "name": "proposed_solutions",
            "required": false,
            "placeholder": "Describe community-proposed solutions"
          }
        ]
      }
    ],
    "metadata": {
      "language": "en",
      "allowOfflineMode": true,
      "allowDrafts": true
    }
  }',
  NOW()
),
(
  'Landfill Monitoring Survey',
  'Specialized survey for landfill sites and facilities',
  'Waste Management',
  '{
    "sections": [
      {
        "id": "section_landfill_info",
        "title": "Landfill Site Information",
        "fields": [
          {
            "id": "field_site_name",
            "type": "text",
            "label": "Landfill Site Name",
            "name": "site_name",
            "required": true
          },
          {
            "id": "field_location",
            "type": "location",
            "label": "Site Location",
            "name": "location",
            "required": true
          },
          {
            "id": "field_operational_status",
            "type": "select",
            "label": "Operational Status",
            "name": "operational_status",
            "required": true,
            "options": ["Active", "Closing", "Closed", "Under Remediation"]
          },
          {
            "id": "field_area_hectares",
            "type": "number",
            "label": "Area (hectares)",
            "name": "area_hectares",
            "required": true,
            "minValue": 0
          }
        ]
      },
      {
        "id": "section_operational_metrics",
        "title": "Operational Metrics",
        "fields": [
          {
            "id": "field_daily_intake",
            "type": "number",
            "label": "Daily Waste Intake (tonnes)",
            "name": "daily_intake",
            "required": true,
            "minValue": 0
          },
          {
            "id": "field_compaction_ratio",
            "type": "number",
            "label": "Compaction Ratio",
            "name": "compaction_ratio",
            "required": true,
            "minValue": 0
          },
          {
            "id": "field_working_face",
            "type": "text",
            "label": "Active Working Face Location",
            "name": "working_face",
            "required": false
          }
        ]
      },
      {
        "id": "section_environmental_controls",
        "title": "Environmental Controls",
        "fields": [
          {
            "id": "field_leachate_management",
            "type": "select",
            "label": "Leachate Management Status",
            "name": "leachate_management",
            "required": true,
            "options": ["Excellent", "Good", "Fair", "Poor", "No System"]
          },
          {
            "id": "field_gas_management",
            "type": "select",
            "label": "Gas Management System",
            "name": "gas_management",
            "required": true,
            "options": ["Active Extraction", "Passive Venting", "No System"]
          },
          {
            "id": "field_liner_condition",
            "type": "select",
            "label": "Liner Condition",
            "name": "liner_condition",
            "required": false,
            "options": ["Good", "Damaged - Minor", "Damaged - Major", "No Liner"]
          },
          {
            "id": "field_capping_status",
            "type": "select",
            "label": "Capping/Cover Status",
            "name": "capping_status",
            "required": false,
            "options": ["Completed", "In Progress", "Not Started", "Partially Complete"]
          }
        ]
      },
      {
        "id": "section_compliance",
        "title": "Compliance & Issues",
        "fields": [
          {
            "id": "field_compliance_status",
            "type": "select",
            "label": "Regulatory Compliance",
            "name": "compliance_status",
            "required": true,
            "options": ["Compliant", "Non-Compliant", "Partially Compliant"]
          },
          {
            "id": "field_issues",
            "type": "textarea",
            "label": "Issues/Violations Observed",
            "name": "issues",
            "required": false,
            "placeholder": "Document any compliance issues"
          },
          {
            "id": "field_photos",
            "type": "image",
            "label": "Site Photos",
            "name": "photos",
            "required": false
          }
        ]
      }
    ],
    "metadata": {
      "language": "en",
      "allowOfflineMode": true,
      "allowDrafts": true
    }
  }',
  NOW()
);

-- Verify insertion
SELECT COUNT(*) as template_count FROM survey_templates;
