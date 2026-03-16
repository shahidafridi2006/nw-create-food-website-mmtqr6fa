import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

interface Category {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  slug: string;
  created_at: string;
  updated_at: string;
}

interface Dish {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null;
  is_featured: boolean;
  is_available: boolean;
  ingredients: string[] | null;
  allergens: string[] | null;
  calories: number | null;
  preparation_time: number | null;
  spice_level: number;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  message?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Get authorization header
    const authHeader = req.headers.get("authorization");
    const apiKey = req.headers.get("apikey") ?? supabaseAnonKey;

    // Create Supabase client with appropriate key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader ?? "",
          apikey: apiKey,
        },
      },
    });

    const url = new URL(req.url);
    const path = url.pathname.replace("/functions/v1/api", "");
    const segments = path.split("/").filter(Boolean);

    // Route handling
    const resource = segments[0] ?? "";
    const resourceId = segments[1] ?? null;

    // Parse query parameters
    const query = url.searchParams;
    const categorySlug = query.get("category");
    const featured = query.get("featured");
    const available = query.get("available");
    const limit = parseInt(query.get("limit") ?? "50");
    const offset = parseInt(query.get("offset") ?? "0");

    let response: ApiResponse;

    switch (resource) {
      case "categories":
        response = await handleCategories(
          supabase,
          req.method,
          resourceId,
          req,
          { limit, offset }
        );
        break;

      case "dishes":
        response = await handleDishes(
          supabase,
          req.method,
          resourceId,
          req,
          {
            categorySlug,
            featured: featured === "true",
            available: available !== "false",
            limit,
            offset,
          }
        );
        break;

      case "featured":
        response = await handleFeaturedDishes(supabase);
        break;

      case "menu":
        response = await handleFullMenu(supabase);
        break;

      case "search":
        const searchTerm = query.get("q") ?? "";
        response = await handleSearch(supabase, searchTerm);
        break;

      default:
        // Return API info for root endpoint
        if (resource === "") {
          response = {
            success: true,
            data: {
              name: "Food Website API",
              version: "1.0.0",
              endpoints: [
                { path: "/categories", methods: ["GET", "POST"] },
                { path: "/categories/:id", methods: ["GET", "PUT", "DELETE"] },
                { path: "/dishes", methods: ["GET", "POST"] },
                { path: "/dishes/:id", methods: ["GET", "PUT", "DELETE"] },
                { path: "/featured", methods: ["GET"] },
                { path: "/menu", methods: ["GET"] },
                { path: "/search?q=term", methods: ["GET"] },
              ],
            },
          };
        } else {
          response = { success: false, error: "Resource not found" };
        }
    }

    return new Response(JSON.stringify(response), {
      status: response.success ? 200 : 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

// Handle categories endpoints
async function handleCategories(
  supabase: ReturnType<typeof createClient>,
  method: string,
  id: string | null,
  req: Request,
  options: { limit: number; offset: number }
): Promise<ApiResponse> {
  switch (method) {
    case "GET":
      if (id) {
        // Get single category with dishes
        const { data: category, error: catError } = await supabase
          .from("categories")
          .select("*")
          .eq("id", id)
          .single();

        if (catError) {
          return { success: false, error: "Category not found" };
        }

        const { data: dishes, error: dishesError } = await supabase
          .from("dishes")
          .select("*")
          .eq("category_id", id)
          .eq("is_available", true);

        return {
          success: true,
          data: {
            ...category,
            dishes: dishesError ? [] : dishes,
          },
        };
      } else {
        // Get all categories
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("name")
          .range(options.offset, options.offset + options.limit - 1);

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true, data };
      }

    case "POST":
      try {
        const body = await req.json();
        const { name, description, image_url, slug } = body;

        if (!name || !slug) {
          return { success: false, error: "Name and slug are required" };
        }

        const { data, error } = await supabase
          .from("categories")
          .insert([{ name, description, image_url, slug }])
          .select()
          .single();

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true, data, message: "Category created successfully" };
      } catch {
        return { success: false, error: "Invalid request body" };
      }

    case "PUT":
      if (!id) {
        return { success: false, error: "Category ID required" };
      }
      try {
        const body = await req.json();
        const { name, description, image_url, slug } = body;

        const { data, error } = await supabase
          .from("categories")
          .update({ name, description, image_url, slug })
          .eq("id", id)
          .select()
          .single();

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true, data, message: "Category updated successfully" };
      } catch {
        return { success: false, error: "Invalid request body" };
      }

    case "DELETE":
      if (!id) {
        return { success: false, error: "Category ID required" };
      }

      const { error: deleteError } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }

      return { success: true, message: "Category deleted successfully" };

    default:
      return { success: false, error: "Method not allowed" };
  }
}

// Handle dishes endpoints
async function handleDishes(
  supabase: ReturnType<typeof createClient>,
  method: string,
  id: string | null,
  req: Request,
  options: {
    categorySlug: string | null;
    featured: boolean;
    available: boolean;
    limit: number;
    offset: number;
  }
): Promise<ApiResponse> {
  switch (method) {
    case "GET":
      if (id) {
        // Get single dish
        const { data, error } = await supabase
          .from("dishes")
          .select(
            `
            *,
            categories (
              id,
              name,
              slug
            )
          `
          )
          .eq("id", id)
          .single();

        if (error) {
          return { success: false, error: "Dish not found" };
        }

        return { success: true, data };
      } else {
        // Build query with filters
        let query = supabase
          .from("dishes")
          .select(
            `
            *,
            categories (
              id,
              name,
              slug
            )
          `
          );

        if (options.categorySlug) {
          // Get category by slug first
          const { data: category } = await supabase
            .from("categories")
            .select("id")
            .eq("slug", options.categorySlug)
            .single();

          if (category) {
            query = query.eq("category_id", category.id);
          }
        }

        if (options.featured) {
          query = query.eq("is_featured", true);
        }

        if (options.available) {
          query = query.eq("is_available", true);
        }

        const { data, error } = await query
          .order("name")
          .range(options.offset, options.offset + options.limit - 1);

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true, data };
      }

    case "POST":
      try {
        const body = await req.json();
        const {
          name,
          description,
          price,
          image_url,
          category_id,
          is_featured,
          is_available,
          ingredients,
          allergens,
          calories,
          preparation_time,
          spice_level,
        } = body;

        if (!name || price === undefined) {
          return { success: false, error: "Name and price are required" };
        }

        const { data, error } = await supabase
          .from("dishes")
          .insert([
            {
              name,
              description,
              price,
              image_url,
              category_id,
              is_featured: is_featured ?? false,
              is_available: is_available ?? true,
              ingredients,
              allergens,
              calories,
              preparation_time,
              spice_level: spice_level ?? 0,
            },
          ])
          .select()
          .single();

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true, data, message: "Dish created successfully" };
      } catch {
        return { success: false, error: "Invalid request body" };
      }

    case "PUT":
      if (!id) {
        return { success: false, error: "Dish ID required" };
      }
      try {
        const body = await req.json();

        const { data, error } = await supabase
          .from("dishes")
          .update(body)
          .eq("id", id)
          .select()
          .single();

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true, data, message: "Dish updated successfully" };
      } catch {
        return { success: false, error: "Invalid request body" };
      }

    case "DELETE":
      if (!id) {
        return { success: false, error: "Dish ID required" };
      }

      const { error: deleteError } = await supabase
        .from("dishes")
        .delete()
        .eq("id", id);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }

      return { success: true, message: "Dish deleted successfully" };

    default:
      return { success: false, error: "Method not allowed" };
  }
}

// Handle featured dishes
async function handleFeaturedDishes(
  supabase: ReturnType<typeof createClient>
): Promise<ApiResponse> {
  const { data, error } = await supabase
    .from("dishes")
    .select(
      `
      *,
      categories (
        id,
        name,
        slug
      )
    `
    )
    .eq("is_featured", true)
    .eq("is_available", true)
    .order("name");

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// Handle full menu with categories
async function handleFullMenu(
  supabase: ReturnType<typeof createClient>
): Promise<ApiResponse> {
  // Get all categories
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (catError) {
    return { success: false, error: catError.message };
  }

  // Get all available dishes
  const { data: dishes, error: dishesError } = await supabase
    .from("dishes")
    .select(
      `
      *,
      categories (
        id,
        name,
        slug
      )
    `
    )
    .eq("is_available", true)
    .order("name");

  if (dishesError) {
    return { success: false, error: dishesError.message };
  }

  // Group dishes by category
  const menu = categories.map((category: Category) => ({
    ...category,
    dishes: dishes.filter(
      (dish: Dish) => dish.category_id === category.id
    ),
  }));

  return { success: true, data: menu };
}

// Handle search
async function handleSearch(
  supabase: ReturnType<typeof createClient>,
  searchTerm: string
): Promise<ApiResponse> {
  if (!searchTerm) {
    return { success: false, error: "Search term required" };
  }

  // Search in dishes
  const { data: dishes, error: dishesError } = await supabase
    .from("dishes")
    .select(
      `
      *,
      categories (
        id,
        name,
        slug
      )
    `
    )
    .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    .eq("is_available", true);

  if (dishesError) {
    return { success: false, error: dishesError.message };
  }

  // Search in categories
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("*")
    .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);

  if (catError) {
    return { success: false, error: catError.message };
  }

  return {
    success: true,
    data: {
      dishes,
      categories,
    },
  };
}