'use server';

import { deleteProduct as deleteProductFromDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function deleteProduct(formData: FormData) {
  const id = formData.get('id') as string;
  await deleteProductFromDb(id);
  revalidatePath('/');
}
