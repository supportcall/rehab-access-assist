export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      assessment_tokens: {
        Row: {
          assessment_id: string
          created_at: string | null
          expires_at: string
          id: string
          token: string
          used: boolean | null
        }
        Insert: {
          assessment_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          used?: boolean | null
        }
        Update: {
          assessment_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_tokens_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          assessment_date: string | null
          client_id: string
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          difficulty_showering: number | null
          difficulty_steps: number | null
          difficulty_toileting: number | null
          difficulty_transfers: number | null
          fall_history: string | null
          id: string
          near_miss_locations: string | null
          primary_goal: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assessment_date?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          difficulty_showering?: number | null
          difficulty_steps?: number | null
          difficulty_toileting?: number | null
          difficulty_transfers?: number | null
          fall_history?: string | null
          id?: string
          near_miss_locations?: string | null
          primary_goal?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assessment_date?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          difficulty_showering?: number | null
          difficulty_steps?: number | null
          difficulty_toileting?: number | null
          difficulty_transfers?: number | null
          fall_history?: string | null
          id?: string
          near_miss_locations?: string | null
          primary_goal?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string | null
          created_by: string | null
          date_of_birth: string | null
          diagnosis: string | null
          first_name: string
          funding_body: Database["public"]["Enums"]["funding_body"] | null
          id: string
          last_name: string
          notes: string | null
          primary_mobility_aid:
            | Database["public"]["Enums"]["mobility_aid"]
            | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          diagnosis?: string | null
          first_name: string
          funding_body?: Database["public"]["Enums"]["funding_body"] | null
          id?: string
          last_name: string
          notes?: string | null
          primary_mobility_aid?:
            | Database["public"]["Enums"]["mobility_aid"]
            | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          diagnosis?: string | null
          first_name?: string
          funding_body?: Database["public"]["Enums"]["funding_body"] | null
          id?: string
          last_name?: string
          notes?: string | null
          primary_mobility_aid?:
            | Database["public"]["Enums"]["mobility_aid"]
            | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      environmental_areas: {
        Row: {
          area_location: Database["public"]["Enums"]["area_location"]
          area_name: string | null
          assessment_id: string
          barriers: string | null
          created_at: string | null
          door_clear_width: number | null
          id: string
          notes: string | null
          photo_urls: string[] | null
          ramp_gradient_going: number | null
          ramp_gradient_riser: number | null
          threshold_height: number | null
          toilet_centerline_left: number | null
          toilet_centerline_right: number | null
          updated_at: string | null
          wall_construction:
            | Database["public"]["Enums"]["wall_construction"]
            | null
        }
        Insert: {
          area_location: Database["public"]["Enums"]["area_location"]
          area_name?: string | null
          assessment_id: string
          barriers?: string | null
          created_at?: string | null
          door_clear_width?: number | null
          id?: string
          notes?: string | null
          photo_urls?: string[] | null
          ramp_gradient_going?: number | null
          ramp_gradient_riser?: number | null
          threshold_height?: number | null
          toilet_centerline_left?: number | null
          toilet_centerline_right?: number | null
          updated_at?: string | null
          wall_construction?:
            | Database["public"]["Enums"]["wall_construction"]
            | null
        }
        Update: {
          area_location?: Database["public"]["Enums"]["area_location"]
          area_name?: string | null
          assessment_id?: string
          barriers?: string | null
          created_at?: string | null
          door_clear_width?: number | null
          id?: string
          notes?: string | null
          photo_urls?: string[] | null
          ramp_gradient_going?: number | null
          ramp_gradient_riser?: number | null
          threshold_height?: number | null
          toilet_centerline_left?: number | null
          toilet_centerline_right?: number | null
          updated_at?: string | null
          wall_construction?:
            | Database["public"]["Enums"]["wall_construction"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "environmental_areas_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_admin_user: {
        Args: {
          admin_email: string
          admin_first_name?: string
          admin_last_name?: string
          admin_password: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "ot_admin" | "client_carer"
      area_location:
        | "bathroom_toilet"
        | "bathroom_shower"
        | "bedroom"
        | "kitchen"
        | "front_entry"
        | "rear_entry"
        | "stairs_internal"
        | "stairs_external"
        | "living_room"
        | "hallway"
        | "ramp"
        | "other"
      funding_body: "ndis" | "my_aged_care" | "private" | "other"
      mobility_aid: "wheelchair" | "walker" | "cane" | "none" | "other"
      wall_construction:
        | "plaster"
        | "brick"
        | "tile_over_plaster"
        | "concrete"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["ot_admin", "client_carer"],
      area_location: [
        "bathroom_toilet",
        "bathroom_shower",
        "bedroom",
        "kitchen",
        "front_entry",
        "rear_entry",
        "stairs_internal",
        "stairs_external",
        "living_room",
        "hallway",
        "ramp",
        "other",
      ],
      funding_body: ["ndis", "my_aged_care", "private", "other"],
      mobility_aid: ["wheelchair", "walker", "cane", "none", "other"],
      wall_construction: [
        "plaster",
        "brick",
        "tile_over_plaster",
        "concrete",
        "other",
      ],
    },
  },
} as const
