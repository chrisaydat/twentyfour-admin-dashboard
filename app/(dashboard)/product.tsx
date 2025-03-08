'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Product as ProductType } from '@/lib/types';
import { deleteProduct, updateProduct, updateProductPrice } from './actions';
import { formatCurrency } from "@/lib/utils"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

type ProductProps = {
  product: ProductType
}

// Define the shape of the response from server actions
type ServerActionResult = {
  success: boolean;
  error?: string;
};

export function Product({ product }: ProductProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedProduct, setEditedProduct] = useState({
    name: product.name,
    description: product.description || '',
    price: product.price,
    image_url: product.image_url,
    category_id: product.category_id
  });

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for numeric fields
    if (name === 'price') {
      // Ensure price is always a number, or 0 if empty/invalid
      const numericValue = value === '' ? 0 : parseFloat(value);
      setEditedProduct(prev => ({
        ...prev,
        [name]: isNaN(numericValue) ? 0 : numericValue
      }));
    } else if (name === 'category_id') {
      // Ensure category_id is always a number, or 0 if empty/invalid
      const numericValue = value === '' ? 0 : parseInt(value);
      setEditedProduct(prev => ({
        ...prev,
        [name]: isNaN(numericValue) ? 0 : numericValue
      }));
    } else {
      // For text fields, just use the value as is
      setEditedProduct(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle edit form submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);

    try {
      // Validate form data
      if (!editedProduct.name.trim()) {
        setError('Product name is required');
        setIsUpdating(false);
        return;
      }

      const numericPrice = typeof editedProduct.price === 'string' 
        ? parseFloat(editedProduct.price) 
        : editedProduct.price;
        
      if (isNaN(numericPrice) || numericPrice < 0) {
        setError('Price must be a valid non-negative number');
        setIsUpdating(false);
        return;
      }

      // Create a FormData with just the editable fields
      const formData = new FormData();
      formData.append('id', product.id.toString());
      formData.append('name', editedProduct.name);
      formData.append('description', editedProduct.description || '');
      formData.append('price', numericPrice.toString());
      
      // We exclude category_id and image_url since they're restricted from editing
      
      console.log('Submitting form data for product update:', {
        id: product.id.toString(),
        name: editedProduct.name,
        description: editedProduct.description || '',
        price: numericPrice,
        price_as_string: numericPrice.toString(),
        // Excluded: image_url and category_id are not sent
      });
      
      // Call the server action to update the product
      const result = await updateProduct(formData) as ServerActionResult;
      
      if (result.success) {
        // Close dialog and refresh
        setIsEditOpen(false);
        alert(`${editedProduct.name} has been updated successfully.`);
        router.refresh();
      } else {
        // Handle the error more safely
        setError(result.error || 'Failed to update product.');
      }
    } catch (err: any) {
      console.error('Error updating product:', err);
      setError(err.message || 'Failed to update product');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete with confirmation
  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      // Create form data for the server action
      const formData = new FormData();
      formData.append('id', product.id);
      
      // Call the server action
      const result = await deleteProduct(formData) as ServerActionResult;
      
      if (result.success) {
        // Double check that the product was actually deleted
        const { data, error: checkError } = await supabase
          .from('products')
          .select('id')
          .eq('id', product.id)
          .single();
        
        if (checkError && checkError.code === 'PGRST116') {
          // Record not found, which is what we want
          alert(`${product.name} has been permanently deleted.`);
          router.refresh();
        } else if (data) {
          // Record still exists
          throw new Error("Product was not deleted. Please try again.");
        } else if (checkError) {
          // Some other error
          throw checkError;
        }
      } else {
        throw new Error(result.error || 'Failed to delete product');
      }
    } catch (err: any) {
      console.error('Error deleting product:', err);
      alert(`Error deleting product: ${err.message || "An unknown error occurred"}`);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Add a new function to directly update only the price
  const handlePriceUpdateOnly = async () => {
    setIsUpdating(true);
    setError(null);

    try {
      // Validate price is a number
      const numericPrice = typeof editedProduct.price === 'string' 
        ? parseFloat(editedProduct.price) 
        : editedProduct.price;
        
      if (isNaN(numericPrice) || numericPrice < 0) {
        setError('Price must be a valid non-negative number');
        setIsUpdating(false);
        return;
      }

      // Create a FormData with just the ID and price
      const formData = new FormData();
      formData.append('id', product.id.toString());
      formData.append('price', numericPrice.toString());
      
      console.log('Sending simple price update:', {
        id: product.id.toString(),
        price: numericPrice
      });
      
      // Call the specialized price update action
      const result = await updateProductPrice(formData) as ServerActionResult;
      
      if (result.success) {
        alert(`Price updated successfully to ${numericPrice}`);
        router.refresh();
      } else {
        setError(result.error || 'Failed to update price');
      }
    } catch (err: any) {
      console.error('Error updating price:', err);
      setError(err.message || 'Failed to update price');
    } finally {
      setIsUpdating(false);
    }
  };

  // Function to update a single field
  const updateSingleField = async (fieldName: string, value: any) => {
    // Skip restricted fields
    if (fieldName === 'category_id' || fieldName === 'image_url') {
      setError('Editing category ID and image URL is not allowed');
      return;
    }
    
    setIsUpdating(true);
    setError(null);

    try {
      // Create a FormData with just the ID and the specific field
      const formData = new FormData();
      formData.append('id', product.id.toString());
      formData.append(fieldName, String(value));
      
      console.log(`Updating single field ${fieldName} to:`, value);
      
      // Call the updateProduct action - it now handles single fields
      const result = await updateProduct(formData) as ServerActionResult;
      
      if (result.success) {
        alert(`${fieldName.replace('_', ' ')} updated successfully`);
        router.refresh();
      } else {
        setError(result.error || `Failed to update ${fieldName}`);
      }
    } catch (err: any) {
      console.error(`Error updating ${fieldName}:`, err);
      setError(err.message || `Failed to update ${fieldName}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Get category name for display
  let categoryDisplay = "";
  switch (product.category_id) {
    case 3: categoryDisplay = "Women Bags"; break;
    case 4: categoryDisplay = "Women Shoes"; break;
    case 5: categoryDisplay = "Women Accessories"; break;
    case 6: categoryDisplay = "Men Bags"; break;
    case 7: categoryDisplay = "Men Shoes"; break;
    case 8: categoryDisplay = "Men Accessories"; break;
    case 9: categoryDisplay = "Other"; break;
    default: categoryDisplay = `Category ${product.category_id}`;
  }

  return (
    <>
      <TableRow>
        <TableCell className="hidden sm:table-cell">
          <Image
            alt="Product image"
            className="aspect-square rounded-md object-cover"
            height={64}
            src={product.image_url}
            width={64}
          />
        </TableCell>
        <TableCell className="font-medium">{product.name}</TableCell>
        <TableCell>
          <Badge variant="outline">
            {categoryDisplay}
          </Badge>
        </TableCell>
        <TableCell className="hidden md:table-cell">{formatCurrency(product.price)}</TableCell>
        <TableCell className="hidden md:table-cell">{product.category_id}</TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label="Open menu" size="icon" variant="ghost" disabled={isDeleting}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setIsDeleteDialogOpen(true)} 
                disabled={isDeleting}
                className="text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* Edit Product Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Make changes to your product here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="font-medium">Name</div>
              <div className="flex gap-2">
                <Input
                  id="name"
                  name="name"
                  value={editedProduct.name}
                  onChange={handleChange}
                  required
                  className="flex-grow"
                />
                <Button 
                  type="button"
                  onClick={() => updateSingleField('name', editedProduct.name)}
                  disabled={isUpdating}
                  size="sm"
                >
                  Update
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="font-medium">Description</div>
              <div className="flex gap-2">
                <Textarea
                  id="description"
                  name="description"
                  value={editedProduct.description}
                  onChange={handleChange}
                  rows={3}
                  className="flex-grow"
                />
                <Button 
                  type="button"
                  onClick={() => updateSingleField('description', editedProduct.description)}
                  disabled={isUpdating}
                  size="sm"
                >
                  Update
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="font-medium">Price</div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    id="price"
                    name="price"
                    value={editedProduct.price}
                    onChange={handleChange}
                    required
                    className="flex-grow"
                  />
                  <Button 
                    type="button"
                    onClick={() => updateSingleField('price', editedProduct.price)}
                    disabled={isUpdating}
                    size="sm"
                  >
                    Update
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="font-medium">Category ID</div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    id="category_id"
                    name="category_id"
                    value={editedProduct.category_id}
                    disabled
                    className="flex-grow bg-gray-100"
                  />
                  <div className="w-[62px] flex items-center">
                    <span className="text-xs text-gray-500">Read-only</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="font-medium">Image URL</div>
              <div className="flex gap-2">
                <Input
                  id="image_url"
                  name="image_url"
                  value={editedProduct.image_url}
                  disabled
                  className="flex-grow bg-gray-100"
                />
                <div className="w-[62px] flex items-center">
                  <span className="text-xs text-gray-500">Read-only</span>
                </div>
              </div>
            </div>
            {error && <div className="text-sm text-red-500">{error}</div>}
            <DialogFooter className="flex justify-between">
              <div>
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={() => {
                    setIsEditOpen(false);
                    setIsDeleteDialogOpen(true);
                  }}
                  disabled={isUpdating}
                  size="sm"
                >
                  Delete Product
                </Button>
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditOpen(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Saving...' : 'Save All Changes'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{product.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Product'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
